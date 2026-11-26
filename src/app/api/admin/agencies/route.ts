import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAdmin } from "@/lib/auth/session";
import { createAdminAgency, listAdminAgenciesAndAgents } from "@/db/queries/admin";

const createAgencySchema = z.object({
  name: z.string().trim().min(2, "Zadejte název kanceláře.").max(120),
  description: z.string().trim().max(1500).optional().nullable(),
  website: z.string().trim().max(255).optional().nullable(),
  email: z.string().trim().email("Neplatný e-mail.").or(z.literal("")).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req.headers);
    const data = await listAdminAgenciesAndAgents();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Načtení agentur selhalo." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req.headers);
    const body = await req.json().catch(() => null);
    const parsed = createAgencySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Neplatná data agentury." },
        { status: 400 },
      );
    }

    const created = await createAdminAgency({
      actorId: admin.id,
      ...parsed.data,
    });
    return NextResponse.json({ ok: true, agency: created }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Vytvoření agentury selhalo." }, { status: 500 });
  }
}
