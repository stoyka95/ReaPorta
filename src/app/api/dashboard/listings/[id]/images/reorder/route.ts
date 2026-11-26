import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertOwnsListingForUser, AuthError, requireAgent } from "@/lib/auth/session";
import { reorderImagesSchema } from "@/features/dashboard/schema";
import { reorderListingImages } from "@/db/queries/dashboard";

const uuidSchema = z.string().uuid();

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgent(req.headers);
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Neplatné ID inzerátu." }, { status: 400 });
    }
    await assertOwnsListingForUser(user, id);

    const body = await req.json();
    const parsed = reorderImagesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Neplatné pořadí fotografií." }, { status: 400 });
    }

    await reorderListingImages(id, parsed.data.orderedIds, parsed.data.coverId);
    revalidatePath(`/dashboard/inzeraty/${id}/upravit`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Pořadí fotografií se nepodařilo uložit." }, { status: 500 });
  }
}
