import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * yisa-s-tenant middleware
 * *.yisa-s.com wildcard subdomain routing.
 * Ana domain (yisa-s.com, www, app) hariç tüm subdomain'leri kabul eder.
 * Geliştirme ortamında localhost'a izin verir.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0]; // Port'u kaldır

  // Geliştirme ortamı kontrolü
  const isDevelopment =
    hostname === "localhost" || hostname === "127.0.0.1";

  if (isDevelopment) {
    return NextResponse.next();
  }

  // Ana domain ve diğer repo'ların domain'lerini reddet
  const reservedHosts = ["yisa-s.com", "www.yisa-s.com", "app.yisa-s.com"];

  if (reservedHosts.includes(hostname)) {
    return new NextResponse("Bu domain tenant reposuna ait değil.", {
      status: 403,
    });
  }

  // *.yisa-s.com wildcard kontrolü
  if (!hostname.endsWith(".yisa-s.com")) {
    return new NextResponse("Geçersiz domain.", { status: 403 });
  }

  // Subdomain'i çıkar ve header'a ekle
  const subdomain = hostname.replace(".yisa-s.com", "");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", subdomain);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
