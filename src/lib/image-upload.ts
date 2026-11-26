import crypto from "node:crypto";
import sharp, { type OutputInfo } from "sharp";
import { getStorageProvider } from "@/lib/storage";

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12 MB
export const MAX_LISTING_IMAGES = 40;

export type DetectedImageFormat = "jpeg" | "png" | "webp";

/**
 * Kontrola skutečných magic bytes (nikoli přípony nebo MIME typu z klienta).
 */
export function detectImageFormat(buffer: Buffer): DetectedImageFormat | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

export class ImageUploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ImageUploadError";
    this.status = status;
  }
}

export interface ProcessedListingImage {
  storageKey: string;
  width: number;
  height: number;
  blurDataUrl: string;
}

/**
 * Zvaliduje magic bytes a velikost, otočí dle EXIF, odstraní veškerá EXIF/GPS metadata
 * a uloží 3 WebP varianty (thumb 320, card 640, full 1600) + blurDataUrl přes StorageProvider.
 */
export async function processAndStoreListingImage(params: {
  buffer: Buffer;
  listingId: string;
}): Promise<ProcessedListingImage> {
  const { buffer, listingId } = params;

  if (buffer.length === 0) {
    throw new ImageUploadError("Soubor je prázdný.");
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new ImageUploadError("Soubor překračuje maximální povolenou velikost 12 MB.");
  }

  const detected = detectImageFormat(buffer);
  if (!detected) {
    throw new ImageUploadError("Soubor není platný obrázek (podporujeme pouze JPG, PNG a WebP).");
  }

  let fullResult: { data: Buffer; info: OutputInfo };
  let cardBuffer: Buffer;
  let thumbBuffer: Buffer;
  let blurBuffer: Buffer;

  try {
    // .rotate() aplikuje EXIF orientaci a výchozí výstup sharp bez .withMetadata() odstraní EXIF i GPS
    const basePipeline = sharp(buffer, { limitInputPixels: 100_000_000 }).rotate();

    fullResult = await basePipeline
      .clone()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer({ resolveWithObject: true });

    cardBuffer = await basePipeline
      .clone()
      .resize({ width: 640, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    thumbBuffer = await basePipeline
      .clone()
      .resize({ width: 320, withoutEnlargement: true })
      .webp({ quality: 76 })
      .toBuffer();

    blurBuffer = await basePipeline.clone().resize({ width: 16 }).webp({ quality: 50 }).toBuffer();
  } catch {
    throw new ImageUploadError("Obrázek je poškozený nebo jej nelze zpracovat.");
  }

  const fileId = crypto.randomUUID();
  const baseKey = `listings/${listingId}/${fileId}`;
  const storage = getStorageProvider();

  await Promise.all([
    storage.put(`${baseKey}-full.webp`, fullResult.data),
    storage.put(`${baseKey}-card.webp`, cardBuffer),
    storage.put(`${baseKey}-thumb.webp`, thumbBuffer),
  ]);

  return {
    storageKey: baseKey,
    width: fullResult.info.width,
    height: fullResult.info.height,
    blurDataUrl: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
  };
}

/**
 * Smaže nahrané varianty obrázku ze storage (sdílený seed pool/ nikdy nemaže).
 */
export async function deleteStoredListingImage(storageKey: string): Promise<void> {
  if (!storageKey.startsWith("listings/")) return;
  const storage = getStorageProvider();
  await Promise.all([
    storage.delete(`${storageKey}-full.webp`),
    storage.delete(`${storageKey}-card.webp`),
    storage.delete(`${storageKey}-thumb.webp`),
  ]);
}
