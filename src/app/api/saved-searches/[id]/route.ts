import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireUser } from "@/lib/auth/session";
import { deleteUserSavedSearch, updateUserSavedSearchFrequency } from "@/db/queries/account";

const patchSchema = z.object({
  frequency: z.enum(["instant", "daily", "weekly", "off"]),
});

const uuidSchema = z.string().uuid();

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req.headers);
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Neplatné ID hledání." }, { status: 400 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Neplatná frekvence upozornění." }, { status: 400 });
    }

    const updated = await updateUserSavedSearchFrequency(user.id, id, parsed.data.frequency);
    if (!updated) {
      return NextResponse.json({ error: "Uložené hledání nebylo nalezeno." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Nepodařilo se upravit hledání." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req.headers);
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Neplatné ID hledání." }, { status: 400 });
    }

    const deleted = await deleteUserSavedSearch(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Uložené hledání nebylo nalezeno." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Nepodařilo se smazat hledání." }, { status: 500 });
  }
}
