import { NextResponse, type NextRequest } from "next/server";

/**
 * Snabb kontroll: saknas inloggningskakan skickas man till inloggningen. Själva sessionen
 * kontrolleras mot databasen i sidorna (lib/auth.ts), inte här.
 */
const PUBLIKA = ["/logga-in", "/skapa-konto", "/offline"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIKA.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  if (req.cookies.has("vk_session")) return NextResponse.next();
  const url = new URL("/logga-in", req.url);
  if (pathname !== "/") url.searchParams.set("nasta", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // API:erna svarar själva med 401; statiska filer, ikoner, manifest och service worker är öppna
  matcher: ["/((?!api|_next/static|_next/image|ikoner|sw\\.js|manifest\\.webmanifest|icon\\.svg|apple-icon\\.png|favicon\\.ico).*)"],
};
