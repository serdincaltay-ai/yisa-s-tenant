import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * yisa-s-tenant middleware
 * *.yisa-s.com wildcard subdomain routing + Supabase auth session yenileme.
 * Tüm domain doğrulama, panel tespiti, tenant çözümleme ve auth koruması
 * lib/supabase/middleware.ts içindeki updateSession() tarafından yapılır.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
