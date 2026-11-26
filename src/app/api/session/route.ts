import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getUserFavoriteIds } from "@/db/queries/account";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req.headers);
  if (!user) {
    return NextResponse.json({ user: null, favoriteIds: [] });
  }
  const favoriteIds = await getUserFavoriteIds(user.id);
  return NextResponse.json({ user, favoriteIds });
}
