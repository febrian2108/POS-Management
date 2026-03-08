import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

const OWNER_PATHS = ["/admin"];
const WORKER_PATHS = ["/pos"];

function hasPrefix(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function authGuard(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (hasPrefix(pathname, OWNER_PATHS)) {
    if (!user) {
      return NextResponse.redirect(new URL("/login-owner", request.url));
    }

    const role = user.app_metadata?.role;
    if (role !== "OWNER") {
      return NextResponse.redirect(new URL("/pos", request.url));
    }
  }

  if (hasPrefix(pathname, WORKER_PATHS)) {
    if (!user) {
      return NextResponse.redirect(new URL("/login-worker", request.url));
    }

    const role = user.app_metadata?.role;
    if (role !== "WORKER") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return response;
}
