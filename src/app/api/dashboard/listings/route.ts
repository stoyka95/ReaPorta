import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { AuthError, requireAgent } from "@/lib/auth/session";
import { draftPatchSchema } from "@/features/dashboard/schema";
import { createDraftListing } from "@/db/queries/dashboard";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAgent(req.headers);
    const body = await req.json().catch(() => ({}));
    const parsed = draftPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Neplatná data konceptu." },
        { status: 400 },
      );
    }

    const created = await createDraftListing(user.id, parsed.data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inzeraty");
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Koncept se nepodařilo vytvořit." }, { status: 500 });
  }
}
