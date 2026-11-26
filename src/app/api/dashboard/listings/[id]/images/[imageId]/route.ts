import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertOwnsListingForUser, AuthError, requireAgent } from "@/lib/auth/session";
import { deleteListingImage } from "@/db/queries/dashboard";

const uuidSchema = z.string().uuid();

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    const user = await requireAgent(req.headers);
    const { id, imageId } = await context.params;
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(imageId).success) {
      return NextResponse.json({ error: "Neplatné ID." }, { status: 400 });
    }
    await assertOwnsListingForUser(user, id);
    const deleted = await deleteListingImage(id, imageId);
    if (!deleted) {
      return NextResponse.json({ error: "Fotografie nebyla nalezena." }, { status: 404 });
    }
    revalidatePath(`/dashboard/inzeraty/${id}/upravit`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Fotografii se nepodařilo smazat." }, { status: 500 });
  }
}
