import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/ucet", "/dashboard", "/admin"];

function hasSessionCookie(req: NextRequest): boolean {
  // Better Auth s cookiePrefix="reaporta" používá reaporta.session_token (nebo __Secure-reaporta.session_token v produkci)
  return Boolean(
    req.cookies.get("reaporta.session_token")?.value ||
    req.cookies.get("__Secure-reaporta.session_token")?.value,
  );
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSessionCookie(req)) {
    const loginUrl = new URL("/prihlaseni", req.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ucet/:path*", "/dashboard/:path*", "/admin/:path*"],
};
