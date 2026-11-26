import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertOwnsListingForUser, AuthError, requireAgent } from "@/lib/auth/session";
import { statusActionSchema } from "@/features/dashboard/schema";
import { transitionAgentListingStatus } from "@/db/queries/dashboard";

const uuidSchema = z.string().uuid();

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgent(req.headers);
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Neplatné ID inzerátu." }, { status: 400 });
    }
    await assertOwnsListingForUser(user, id);

    const body = await req.json();
    const parsed = statusActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Neplatná změna stavu." }, { status: 400 });
    }

    const result = await transitionAgentListingStatus(id, parsed.data.action);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inzeraty");
    revalidatePath("/");
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Stav se nepodařilo změnit." }, { status: 500 });
  }
}
