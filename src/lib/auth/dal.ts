import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { DashboardRole } from "@prisma/client";
import { auth } from "./auth";

/**
 * Data Access Layer for authorization.
 *
 * Per the Next.js 16 authentication guide, layout/proxy checks are NOT a
 * sufficient authorization boundary (Partial Rendering means layouts don't
 * re-render on navigation, and Server Actions / nested routes have independent
 * entry points). Authorization must be enforced close to the data/action.
 * These helpers are that authoritative boundary; `proxy.ts` is only an
 * optimistic, defense-in-depth pre-filter.
 */

export type SessionUser = {
  id: string;
  role: DashboardRole;
  email?: string | null;
  name?: string | null;
};

/**
 * Resolves the current dashboard user from the session JWT. Memoized per
 * request via React `cache` so repeated calls in one render don't re-decode.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id || !user.role) return null;
  return { id: user.id, role: user.role, email: user.email, name: user.name };
});

/**
 * For Server Components / Server Actions: redirect-based enforcement.
 * Returns the user when authorized; otherwise redirects (never returns).
 */
export async function requireRole(allowed: DashboardRole[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) redirect("/dashboard?forbidden=1");
  return user;
}

/**
 * For Route Handlers (JSON APIs): returns either the authorized user, or a
 * NextResponse (401/403) the caller must early-return. We don't redirect here
 * because API clients should receive a status code, not an HTML redirect.
 *
 *   const gate = await requireApiRole(["ADMIN"]);
 *   if ("response" in gate) return gate.response;
 *   const { user } = gate;
 */
export async function requireApiRole(
  allowed: DashboardRole[],
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!allowed.includes(user.role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

/** Convenience tiers. */
export const ADMIN_ROLES: DashboardRole[] = ["OWNER", "SUPER_ADMIN", "ADMIN"];
export const MODERATOR_ROLES: DashboardRole[] = ["OWNER", "SUPER_ADMIN", "ADMIN", "MODERATOR"];
