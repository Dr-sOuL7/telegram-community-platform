import { describe, it, expect, vi, beforeEach } from "vitest";

// `auth()` is the session source; mock it per-test.
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("../src/lib/auth/auth", () => ({ auth: authMock }));
// React `cache` needs a render scope; make it a passthrough for unit testing.
vi.mock("react", () => ({ cache: <T,>(fn: T) => fn }));

import { requireApiRole, requireRole, ADMIN_ROLES } from "../src/lib/auth/dal";

describe("requireApiRole — admin route gating", () => {
  beforeEach(() => authMock.mockReset());

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const r = await requireApiRole(ADMIN_ROLES);
    expect("response" in r).toBe(true);
    if ("response" in r) expect(r.response.status).toBe(401);
  });

  it("returns 403 for a VIEWER hitting an admin route", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "VIEWER" } });
    const r = await requireApiRole(ADMIN_ROLES);
    expect("response" in r).toBe(true);
    if ("response" in r) expect(r.response.status).toBe(403);
  });

  it("returns 403 for a MODERATOR hitting an admin route", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "MODERATOR" } });
    const r = await requireApiRole(ADMIN_ROLES);
    expect("response" in r).toBe(true);
    if ("response" in r) expect(r.response.status).toBe(403);
  });

  it("allows OWNER / SUPER_ADMIN / ADMIN", async () => {
    for (const role of ["OWNER", "SUPER_ADMIN", "ADMIN"]) {
      authMock.mockResolvedValue({ user: { id: "u1", role } });
      const r = await requireApiRole(ADMIN_ROLES);
      expect("user" in r, role).toBe(true);
      if ("user" in r) expect(r.user.role).toBe(role);
    }
  });

  it("rejects a session missing id or role", async () => {
    authMock.mockResolvedValue({ user: { email: "x@y.z" } });
    const r = await requireApiRole(ADMIN_ROLES);
    expect("response" in r).toBe(true);
    if ("response" in r) expect(r.response.status).toBe(401);
  });
});

describe("requireRole — page/action gating redirects", () => {
  beforeEach(() => authMock.mockReset());

  it("redirects (throws) an unauthenticated user", async () => {
    authMock.mockResolvedValue(null);
    // next/navigation redirect throws NEXT_REDIRECT; assert it does not resolve.
    await expect(requireRole(ADMIN_ROLES)).rejects.toBeTruthy();
  });
});
