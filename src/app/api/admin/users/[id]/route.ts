import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAdmin } from "@/lib/auth/session";
import { updateAdminUser } from "@/db/queries/admin";

const patchUserSchema = z.object({
  role: z.enum(["user", "agent", "admin"]).optional(),
  blocked: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req.headers);
    const { id } = await context.params;
    const body = await req.json().catch(() => null);
    const parsed = patchUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Neplatné parametry uživatele." }, { status: 400 });
    }

    const result = await updateAdminUser({
      actorId: admin.id,
      targetUserId: id,
      role: parsed.data.role,
      blocked: parsed.data.blocked,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Úprava uživatele se nezdařila." }, { status: 500 });
  }
}
