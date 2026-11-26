import { NextRequest, NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { getAuth } from "@/lib/auth/auth";
import { consumeRateLimit, extractClientIp, hashIp, resetRateLimitKey } from "@/lib/rate-limit";

function getHandler() {
  return toNextJsHandler(getAuth());
}

export async function GET(req: NextRequest) {
  return getHandler().GET(req);
}

export async function POST(req: NextRequest) {
  const handler = getHandler();
  const pathname = req.nextUrl.pathname;
  const ipHash = hashIp(extractClientIp(req));

  // Rate limit pro přihlášení (5 chybných pokusů / 15 min na IP — 6. pokus dostane 429 dle QA B3)
  if (pathname.endsWith("/sign-in/email")) {
    const key = `auth:signin:${ipHash}`;
    const rl = await consumeRateLimit({ key, limit: 5, windowSeconds: 15 * 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        {
          code: "TOO_MANY_REQUESTS",
          message:
            "Příliš mnoho chybných pokusů o přihlášení. Zkuste to prosím znovu za několik minut.",
        },
        { status: 429 },
      );
    }

    const res = await handler.POST(req);
    if (res.ok) {
      await resetRateLimitKey(key);
    }
    return res;
  }

  // Rate limit + kontrola duplicitního e-mailu pro registraci (QA B1)
  if (pathname.endsWith("/sign-up/email")) {
    const rl = await consumeRateLimit({
      key: `auth:signup:${ipHash}`,
      limit: 10,
      windowSeconds: 60 * 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        {
          code: "TOO_MANY_REQUESTS",
          message: "Příliš mnoho pokusů o registraci. Zkuste to prosím později.",
        },
        { status: 429 },
      );
    }

    const cloned = req.clone();
    const body = (await cloned.json().catch(() => null)) as { email?: string } | null;
    const email = body?.email?.trim();
    if (email) {
      const db = getDb();
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .limit(1);
      if (existing) {
        return NextResponse.json(
          {
            code: "USER_ALREADY_EXISTS",
            message:
              "Registraci s tímto e-mailem nelze dokončit. Zkuste se prosím přihlásit nebo obnovit heslo.",
          },
          { status: 409 },
        );
      }
    }
  }

  // Rate limit pro žádost o obnovu hesla (5 / hodinu na IP)
  if (pathname.endsWith("/request-password-reset") || pathname.endsWith("/forget-password")) {
    const rl = await consumeRateLimit({
      key: `auth:reset:${ipHash}`,
      limit: 5,
      windowSeconds: 60 * 60,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        {
          code: "TOO_MANY_REQUESTS",
          message: "Příliš mnoho žádostí o obnovu hesla. Zkuste to prosím později.",
        },
        { status: 429 },
      );
    }
  }

  return handler.POST(req);
}
