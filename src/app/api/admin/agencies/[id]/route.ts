import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAdmin } from "@/lib/auth/session";
import { deleteAdminAgency, updateAdminAgency } from "@/db/queries/admin";

const updateAgencySchema = z.object({
  name: z.string().trim().min(2, "Zadejte název kanceláře.").max(120),
  description: z.string().trim().max(1500).optional().nullable(),
  website: z.string().trim().max(255).optional().nullable(),
  email: z.string().trim().email("Neplatný e-mail.").or(z.literal("")).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req.headers);
    const { id } = await context.params;
    const body = await req.json().catch(() => null);
    const parsed = updateAgencySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Neplatné údaje agentury." },
        { status: 400 },
      );
    }

    const ok = await updateAdminAgency({ actorId: admin.id, id, ...parsed.data });
    if (!ok) {
      return NextResponse.json({ error: "Agentura nebyla nalezena." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Úprava agentury selhala." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req.headers);
    const { id } = await context.params;
    const ok = await deleteAdminAgency({ actorId: admin.id, id });
    if (!ok) {
      return NextResponse.json({ error: "Agentura nebyla nalezena." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Smazání agentury selhalo." }, { status: 500 });
  }
}
