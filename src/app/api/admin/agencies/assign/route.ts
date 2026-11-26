import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAdmin } from "@/lib/auth/session";
import { assignAgentToAgency } from "@/db/queries/admin";

const assignSchema = z.object({
  agentUserId: z.string().uuid(),
  agencyId: z.string().uuid().nullable(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req.headers);
    const body = await req.json().catch(() => null);
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Neplatné přiřazení makléře." }, { status: 400 });
    }

    const ok = await assignAgentToAgency({
      actorId: admin.id,
      agentUserId: parsed.data.agentUserId,
      agencyId: parsed.data.agencyId,
    });
    if (!ok) {
      return NextResponse.json({ error: "Profil makléře nebyl nalezen." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Přiřazení makléře selhalo." }, { status: 500 });
  }
}
