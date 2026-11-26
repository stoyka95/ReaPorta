import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, requireAgent } from "@/lib/auth/session";
import { updateAgentProfile } from "@/db/queries/profiles";

const agentProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Jméno musí mít alespoň 2 znaky.")
    .max(80, "Jméno může mít nejvýše 80 znaků."),
  bio: z
    .string()
    .trim()
    .max(1500, "Medailonek může mít nejvýše 1 500 znaků.")
    .optional()
    .nullable(),
  phonePublic: z.string().trim().max(32).optional().nullable(),
  emailPublic: z
    .union([z.string().trim().email("Zadejte platný veřejný e-mail."), z.literal(""), z.null()])
    .optional(),
  languages: z
    .array(z.enum(["cs", "en", "de", "sk", "uk"]))
    .min(1)
    .max(5),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAgent(req.headers);
    const body = await req.json();
    const parsed = agentProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Neplatné údaje profilu." },
        { status: 400 },
      );
    }

    await updateAgentProfile(user.id, parsed.data);
    revalidatePath("/dashboard/profil");
    revalidatePath("/makleri");
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Profil makléře se nepodařilo uložit." }, { status: 500 });
  }
}
