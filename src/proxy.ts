import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth/auth";

/**
 * Next.js 16 Proxy (formerly Middleware). Optimistic, defense-in-depth gate.
 *
 * This is NOT the authoritative authorization boundary — the DAL
 * (`requireRole`/`requireApiRole`) enforced inside pages/route handlers is.
 * Per the Next 16 auth guide, proxy runs on every matched request (incl.
 * prefetches), so it stays cheap and fails OPEN on error: if the session
 * lookup throws, we let the request through and rely on the DAL. This keeps
 * availability intact while still pre-filtering the common cases.
 *
 * The matcher deliberately excludes `/login` and `/api/auth/*` so sign-in
 * can never be locked out by this gate.
 */

const ADMIN_ROLES = new Set(["OWNER", "SUPER_ADMIN", "ADMIN"]);

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isDashboard && !isAdminApi) return NextResponse.next();

  let session: Session | null = null;
  try {
    session = await auth();
  } catch {
    // Fail open — the DAL is the real guard.
    return NextResponse.next();
  }

  if (!session) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  const role = (session.user as { role?: string } | undefined)?.role;
  if (isAdminApi && (!role || !ADMIN_ROLES.has(role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"],
};
