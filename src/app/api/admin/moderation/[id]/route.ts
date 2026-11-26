import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAdmin } from "@/lib/auth/session";
import { moderateListing } from "@/db/queries/admin";

const moderateSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(1000).optional(),
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req.headers);
    const { id } = await context.params;
    const body = await req.json().catch(() => null);
    const parsed = moderateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Neplatná data pro moderaci." },
        { status: 400 },
      );
    }

    const result = await moderateListing({
      actorId: admin.id,
      listingId: id,
      decision: parsed.data.decision,
      reason: parsed.data.reason,
      baseUrl: req.nextUrl.origin,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, status: result.status, slug: result.slug });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Moderaci se nepodařilo dokončit." }, { status: 500 });
  }
}
