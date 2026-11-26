import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireUser } from "@/lib/auth/session";
import { addUserFavorite, toggleUserFavorite } from "@/db/queries/account";

const toggleSchema = z.object({
  listingId: z.string().uuid("Neplatné ID nabídky."),
  mode: z.enum(["toggle", "add"]).optional().default("toggle"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req.headers);
    const body = await req.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Neplatná data." },
        { status: 400 },
      );
    }

    if (parsed.data.mode === "add") {
      await addUserFavorite(user.id, parsed.data.listingId);
      return NextResponse.json({ favorited: true });
    }

    const result = await toggleUserFavorite(user.id, parsed.data.listingId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof Error && err.message === "LISTING_NOT_FOUND") {
      return NextResponse.json({ error: "Nabídka nebyla nalezena." }, { status: 404 });
    }
    return NextResponse.json({ error: "Nepodařilo se uložit oblíbenou nabídku." }, { status: 500 });
  }
}
