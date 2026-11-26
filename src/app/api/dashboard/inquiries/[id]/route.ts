import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, requireAgent } from "@/lib/auth/session";
import { updateAgentInquiryStatus } from "@/db/queries/profiles";

const uuidSchema = z.string().uuid();
const statusSchema = z.object({
  status: z.enum(["new", "read", "replied", "archived"]),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgent(req.headers);
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Neplatné ID poptávky." }, { status: 400 });
    }

    const body = await req.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Neplatný stav poptávky." }, { status: 400 });
    }

    const ok = await updateAgentInquiryStatus(
      user.id,
      id,
      parsed.data.status,
      user.role === "admin",
    );
    if (!ok) {
      return NextResponse.json({ error: "Poptávka nebyla nalezena." }, { status: 404 });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/poptavky");
    return NextResponse.json({ ok: true, status: parsed.data.status });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Stav poptávky se nepodařilo změnit." }, { status: 500 });
  }
}
