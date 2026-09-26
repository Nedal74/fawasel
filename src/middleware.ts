import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_COOKIE } from "@/lib/locale";

/**
 * Language-addressable URLs for search engines (hreflang).
 *
 * The site stores the reader's language in a cookie, which crawlers don't
 * keep. `?lang=ar` / `?lang=en` renders that language directly (and remembers
 * it for the visitor), so each language has its own URL to point hreflang at.
 * The request path is forwarded so the root layout can build those links.
 */
export function middleware(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");
  const valid = lang === "en" || lang === "ar";

  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  if (valid) headers.set("x-locale", lang);
  else headers.delete("x-locale");

  const response = NextResponse.next({ request: { headers } });
  if (valid && request.cookies.get(LOCALE_COOKIE)?.value !== lang) {
    response.cookies.set(LOCALE_COOKIE, lang, { path: "/", maxAge: 31_536_000, sameSite: "lax" });
  }
  return response;
}

export const config = {
  // Pages only: not the API, the dashboard, Next internals or static files.
  matcher: ["/((?!api|admin|_next|uploads|images|favicon|robots|sitemap|.*\\.[a-zA-Z0-9]+$).*)"],
};
