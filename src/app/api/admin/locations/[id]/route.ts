import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAdmin } from "@/lib/auth/session";
import { updateAdminLocation } from "@/db/queries/admin";

const updateLocationSchema = z.object({
  name: z.string().trim().min(1, "Název nesmí být prázdný.").max(120),
  lat: z.number().min(48).max(52),
  lng: z.number().min(11).max(19.5),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req.headers);
    const { id } = await context.params;
    const numericId = Number.parseInt(id, 10);
    if (!Number.isFinite(numericId)) {
      return NextResponse.json({ error: "Neplatné ID lokality." }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = updateLocationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Neplatné údaje lokality." },
        { status: 400 },
      );
    }

    const ok = await updateAdminLocation({
      actorId: admin.id,
      id: numericId,
      ...parsed.data,
    });

    if (!ok) {
      return NextResponse.json({ error: "Lokalita nebyla nalezena." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Uložení lokality selhalo." }, { status: 500 });
  }
}
