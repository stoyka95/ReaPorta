import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireUser } from "@/lib/auth/session";
import { createUserSavedSearch, getUserSavedSearches } from "@/db/queries/account";

const createSavedSearchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Zadejte prosím název hledání (alespoň 2 znaky).")
    .max(80, "Název může mít nejvýše 80 znaků."),
  frequency: z.enum(["instant", "daily", "weekly", "off"]).default("daily"),
  params: z.record(z.string(), z.unknown()),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req.headers);
    const items = await getUserSavedSearches(user.id);
    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Nepodařilo se načíst uložená hledání." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req.headers);
    const body = await req.json();
    const parsed = createSavedSearchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Neplatná data hledání." },
        { status: 400 },
      );
    }

    const item = await createUserSavedSearch(user.id, parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Nepodařilo se uložit hledání." }, { status: 500 });
  }
}
