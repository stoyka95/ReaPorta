import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertOwnsListingForUser, AuthError, requireAgent } from "@/lib/auth/session";
import { duplicateAgentListing } from "@/db/queries/dashboard";

const uuidSchema = z.string().uuid();

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgent(req.headers);
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Neplatné ID inzerátu." }, { status: 400 });
    }
    await assertOwnsListingForUser(user, id);
    const created = await duplicateAgentListing(user.id, id);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inzeraty");
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Inzerát se nepodařilo duplikovat." }, { status: 500 });
  }
}
