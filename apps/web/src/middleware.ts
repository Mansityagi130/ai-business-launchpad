import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  
  // Read session token set by supabase auth cookies
  const token = request.cookies.get("sb-access-token")?.value;

  const isProtectedRoute = pathname.startsWith("/dashboard") || 
                           pathname.startsWith("/editor");

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Subdomain resolution logic
  const hostname = request.headers.get("host") || "";
  
  // Define hostnames that should be ignored for subdomain routing
  const mainDomains = ["localhost:3000", "launchpad.ai", "project-name.vercel.app", "ai-business-launchpad.vercel.app", "ai-business-launchpad-web.vercel.app"];
  
  // Find if current hostname is a subdomain
  let subdomain = "";
  
  // Simple check for localhost subdomain: e.g. sub.localhost:3000
  if (hostname.includes(".localhost:3000")) {
    subdomain = hostname.split(".localhost:3000")[0];
  } else {
    // For production domains
    const parts = hostname.split(".");
    if (parts.length > 2) {
      // e.g. sub.launchpad.ai -> sub, but exclude www
      if (parts[0] !== "www") {
        subdomain = parts[0];
      }
    }
  }

  // Rewrite to /[subdomain]/pathname if we have a subdomain and it's not a static/system route
  if (
    subdomain &&
    !mainDomains.includes(hostname) &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/static") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/signup") &&
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/editor")
  ) {
    url.pathname = `/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Intercept dashboard, editor and root paths for routing resolution
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/editor/:path*",
    "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+$).*)"
  ],
};
