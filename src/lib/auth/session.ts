import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { listings, users } from "@/db/schema";
import { getAuth } from "@/lib/auth/auth";

export type UserRole = "user" | "agent" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarKey: string | null;
  role: UserRole;
  emailVerified: boolean;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function getSessionUser(requestHeaders?: Headers): Promise<SessionUser | null> {
  const hdrs = requestHeaders ?? (await headers());
  const session = await getAuth().api.getSession({ headers: hdrs });
  if (!session?.user?.id) return null;

  const db = getDb();
  const [u] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      avatarKey: users.avatarKey,
      role: users.role,
      emailVerified: users.emailVerified,
      blockedAt: users.blockedAt,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!u || u.blockedAt !== null || u.deletedAt !== null) {
    return null;
  }

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    avatarKey: u.avatarKey,
    role: u.role,
    emailVerified: u.emailVerified,
  };
}

/**
 * Pro API route handlery a Server Actions (vyhazuje AuthError 401/403).
 */
export async function requireUser(requestHeaders?: Headers): Promise<SessionUser> {
  const user = await getSessionUser(requestHeaders);
  if (!user) {
    throw new AuthError("Pro tuto akci se musíte přihlásit.", 401);
  }
  return user;
}

export async function requireAgent(requestHeaders?: Headers): Promise<SessionUser> {
  const user = await requireUser(requestHeaders);
  if (user.role !== "agent" && user.role !== "admin") {
    throw new AuthError("Tato akce je určena pouze pro makléře.", 403);
  }
  return user;
}

export async function requireAdmin(requestHeaders?: Headers): Promise<SessionUser> {
  const user = await requireUser(requestHeaders);
  if (user.role !== "admin") {
    throw new AuthError("Nemáte oprávnění správce.", 403);
  }
  return user;
}

/**
 * Čistá funkce kontroly vlastnictví inzerátu (testovatelná i přímo proti DB).
 */
export async function assertOwnsListingForUser(
  user: Pick<SessionUser, "id" | "role">,
  listingId: string,
): Promise<{ id: string; agentId: string; status: string }> {
  const db = getDb();
  const [row] = await db
    .select({
      id: listings.id,
      agentId: listings.agentId,
      status: listings.status,
    })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);

  if (!row) {
    throw new AuthError("Inzerát nebyl nalezen.", 404);
  }

  if (user.role !== "admin" && row.agentId !== user.id) {
    throw new AuthError("Nemáte oprávnění upravovat cizí inzerát.", 403);
  }

  return row;
}

export async function assertOwnsListing(
  listingId: string,
  requestHeaders?: Headers,
): Promise<{ user: SessionUser; listing: { id: string; agentId: string; status: string } }> {
  const user = await requireAgent(requestHeaders);
  const listing = await assertOwnsListingForUser(user, listingId);
  return { user, listing };
}

/**
 * Pro Server Component stránky (přesměrování na přihlášení s ?next= nebo 403 stránku).
 */
export async function requirePageUser(nextPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/prihlaseni?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function requirePageAgent(nextPath: string): Promise<SessionUser> {
  const user = await requirePageUser(nextPath);
  if (user.role !== "agent" && user.role !== "admin") {
    redirect("/nemate-opravneni");
  }
  return user;
}

export async function requirePageAdmin(nextPath: string): Promise<SessionUser> {
  const user = await requirePageUser(nextPath);
  if (user.role !== "admin") {
    redirect("/nemate-opravneni");
  }
  return user;
}
