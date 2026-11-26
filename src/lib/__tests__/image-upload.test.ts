import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  deleteStoredListingImage,
  detectImageFormat,
  ImageUploadError,
  MAX_UPLOAD_BYTES,
  processAndStoreListingImage,
} from "../image-upload";
import { getStorageProvider } from "../storage";
import fs from "node:fs/promises";

describe("image-upload security & sharp processing (AC-6.5 / QA C2)", () => {
  it("detects valid JPEG, PNG, and WebP magic bytes and rejects fake text files", async () => {
    const pngBuf = await sharp({
      create: { width: 100, height: 80, channels: 3, background: { r: 109, g: 63, b: 224 } },
    })
      .png()
      .toBuffer();

    const jpegBuf = await sharp(pngBuf).jpeg().toBuffer();
    const webpBuf = await sharp(pngBuf).webp().toBuffer();
    const fakeTxtAsJpg = Buffer.from("Toto není obrázek, ale obyčejný textový soubor.", "utf8");

    expect(detectImageFormat(pngBuf)).toBe("png");
    expect(detectImageFormat(jpegBuf)).toBe("jpeg");
    expect(detectImageFormat(webpBuf)).toBe("webp");
    expect(detectImageFormat(fakeTxtAsJpg)).toBeNull();
  });

  it("rejects files larger than 12 MB and fake renamed .txt files", async () => {
    const fakeTxt = Buffer.from("fake image content 1234567890", "utf8");
    await expect(
      processAndStoreListingImage({ buffer: fakeTxt, listingId: "test-listing" }),
    ).rejects.toBeInstanceOf(ImageUploadError);

    const oversized = Buffer.alloc(MAX_UPLOAD_BYTES + 1, 0xff);
    oversized[0] = 0xff;
    oversized[1] = 0xd8;
    oversized[2] = 0xff;
    await expect(
      processAndStoreListingImage({ buffer: oversized, listingId: "test-listing" }),
    ).rejects.toThrow(/12 MB/);
  });

  it("re-encodes to WebP variants, strips EXIF metadata, and cleans up files on delete", async () => {
    const withExif = await sharp({
      create: { width: 800, height: 600, channels: 3, background: { r: 244, g: 244, b: 246 } },
    })
      .jpeg()
      .withMetadata({
        exif: {
          IFD0: { Make: "SecretCamera", Copyright: "GPS-Test" },
        },
      })
      .toBuffer();

    const metaBefore = await sharp(withExif).metadata();
    expect(metaBefore.exif).toBeDefined();

    const result = await processAndStoreListingImage({
      buffer: withExif,
      listingId: "unit-test-exif",
    });

    try {
      expect(result.storageKey.startsWith("listings/unit-test-exif/")).toBe(true);
      expect(result.blurDataUrl.startsWith("data:image/webp;base64,")).toBe(true);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);

      const storage = getStorageProvider();
      const fullPath = storage.resolvePath(`${result.storageKey}-full.webp`);
      const fullBytes = await fs.readFile(fullPath);
      const metaAfter = await sharp(fullBytes).metadata();
      expect(metaAfter.format).toBe("webp");
      // EXIF musí být odstraněn
      expect(metaAfter.exif).toBeUndefined();
    } finally {
      await deleteStoredListingImage(result.storageKey);
    }
  });
});
