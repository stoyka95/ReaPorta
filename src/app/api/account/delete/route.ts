import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth/session";
import { deleteUserAccount } from "@/db/queries/account";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req.headers);
    await deleteUserAccount(user.id);

    const res = NextResponse.json({ ok: true });
    // Vymazat session cookies
    res.cookies.set("reaporta.session_token", "", { maxAge: 0, path: "/" });
    res.cookies.set("__Secure-reaporta.session_token", "", { maxAge: 0, path: "/" });
    return res;
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Nepodařilo se smazat účet." }, { status: 500 });
  }
}
