import { auth } from "./lib/auth/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
  const isLoginRoute = nextUrl.pathname === "/login";
  const isApiDashboardRoute = nextUrl.pathname.startsWith("/api/v1/dashboard");

  if (!isAuthenticated && (isDashboardRoute || isApiDashboardRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAuthenticated && isLoginRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api/v1/webhook|_next/static|_next/image|favicon.ico).*)"],
};
