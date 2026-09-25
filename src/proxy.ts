import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n";
import { REGION_HEADER, detectRegion } from "@/lib/region";

/**
 * Two jobs, both cheap, both resolved into request headers that the server
 * components read.
 *
 * 1. Region. Resolved from whichever country header the host provides —
 *    Vercel, Cloudflare, or a reverse proxy — and turned into Lebanon or
 *    International here, once. No cookie and no override: pricing is not
 *    something a visitor gets to choose.
 *
 * 2. Locale. Routes live under `app/[locale]/`, but English keeps the bare
 *    URL: `/shop`, not `/en/shop`. A rewrite (not a redirect) maps the bare
 *    path onto the `en` segment, so the address bar stays clean and the
 *    already-published links keep working. French is explicit at `/fr/...`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocalePrefix = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  const locale =
    LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)) ??
    DEFAULT_LOCALE;

  /* Host-agnostic: Vercel, Cloudflare or a configured reverse proxy. If no
     host supplies a country at all, every visitor is priced as international
     — correct as a fallback, but on a Lebanese shop it means nobody local
     ever sees the local price, so it is worth saying out loud once. */
  const { region, headerUsed } = detectRegion(request.headers);
  if (!headerUsed && process.env.NODE_ENV === "production") {
    console.warn(
      "[zuruny] No country header on this request — pricing everyone as INTL. " +
        "Put Cloudflare in front, or have the proxy set x-geo-country.",
    );
  }

  // The root layout owns <html lang> but never sees route params, and pricing
  // must not be a cookie, so both ride along as request headers.
  const headers = new Headers(request.headers);
  headers.set("x-zuruny-locale", locale);
  headers.set(REGION_HEADER, region);

  if (hasLocalePrefix) {
    return NextResponse.next({ request: { headers } });
  }

  // Bare path — render it as the default locale without changing the URL.
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Everything except Next internals and files with an extension.
  matcher: ["/((?!_next|api|.*\\.).*)"],
};
