import type { NextRequest } from "next/server";

import { authGuard } from "@/lib/auth/guards";

export async function proxy(request: NextRequest) {
  return authGuard(request);
}

export const config = {
  matcher: ["/admin/:path*", "/pos", "/login-owner", "/login-worker"]
};
