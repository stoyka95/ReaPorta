import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAdmin } from "@/lib/auth/session";
import { resolveAdminReport } from "@/db/queries/admin";

const resolveSchema = z.object({
  action: z.enum(["hide_listing", "dismiss"]),
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req.headers);
    const { id } = await context.params;
    const body = await req.json().catch(() => null);
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Neplatná akce vyřešení nahlášení." }, { status: 400 });
    }

    const result = await resolveAdminReport({
      actorId: admin.id,
      reportId: id,
      action: parsed.data.action,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      listingId: result.listingId,
      listingSlug: result.listingSlug,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Vyřešení nahlášení selhalo." }, { status: 500 });
  }
}
