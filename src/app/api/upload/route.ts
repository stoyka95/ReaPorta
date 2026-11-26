import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertOwnsListingForUser, AuthError, requireAgent } from "@/lib/auth/session";
import {
  ImageUploadError,
  MAX_LISTING_IMAGES,
  MAX_UPLOAD_BYTES,
  processAndStoreListingImage,
} from "@/lib/image-upload";
import { addListingImageRecord, countListingImages } from "@/db/queries/dashboard";

const uuidSchema = z.string().uuid();

export async function POST(req: NextRequest) {
  try {
    const user = await requireAgent(req.headers);
    const formData = await req.formData();

    const listingId = String(formData.get("listingId") ?? "");
    if (!uuidSchema.safeParse(listingId).success) {
      return NextResponse.json({ error: "Neplatné ID inzerátu." }, { status: 400 });
    }

    await assertOwnsListingForUser(user, listingId);

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Chybí nahrávaný soubor." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Soubor překračuje maximální povolenou velikost 12 MB." },
        { status: 400 },
      );
    }

    const currentCount = await countListingImages(listingId);
    if (currentCount >= MAX_LISTING_IMAGES) {
      return NextResponse.json(
        { error: `K jednomu inzerátu lze nahrát nejvýše ${MAX_LISTING_IMAGES} fotografií.` },
        { status: 400 },
      );
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const processed = await processAndStoreListingImage({ buffer, listingId });

    const altRaw = String(formData.get("alt") ?? "").trim();
    const alt = altRaw || `Fotografie nemovitosti ${currentCount + 1}`;

    const image = await addListingImageRecord({
      listingId,
      storageKey: processed.storageKey,
      width: processed.width,
      height: processed.height,
      blurDataUrl: processed.blurDataUrl,
      alt,
    });

    revalidatePath(`/dashboard/inzeraty/${listingId}/upravit`);
    return NextResponse.json({ image }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof ImageUploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Fotografii se nepodařilo nahrát." }, { status: 500 });
  }
}
