import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/set-password", "/forgot-password", "/reset-password"];
// /set-password and /reset-password are intentionally excluded here: once
// their client-side code calls supabase.auth.setSession() to process an
// invite/recovery link, the browser is "authenticated" for every subsequent
// request on that page — including the server action that finalizes account
// setup. Redirecting those away breaks the flow (and also mid-way "already
// logged in as someone else" cases). /forgot-password is left out too for
// symmetry, so only /login redirects an authenticated visitor.
const REDIRECT_IF_AUTHENTICATED_ROUTES = ["/login"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const isAuthenticated = !!data.user;
  const isPublicRoute = PUBLIC_ROUTES.includes(request.nextUrl.pathname);

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    isAuthenticated &&
    REDIRECT_IF_AUTHENTICATED_ROUTES.includes(request.nextUrl.pathname)
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
