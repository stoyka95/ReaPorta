import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireUser } from "@/lib/auth/session";
import { updateUserProfile } from "@/db/queries/account";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Jméno musí mít alespoň 2 znaky.")
    .max(80, "Jméno může mít nejvýše 80 znaků."),
  phone: z.string().trim().max(32, "Telefon může mít nejvýše 32 znaků.").optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req.headers);
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Neplatné údaje profilu." },
        { status: 400 },
      );
    }

    await updateUserProfile(user.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Nepodařilo se uložit profil." }, { status: 500 });
  }
}
