import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n";
import { REGION_HEADER, detectRegion } from "@/lib/region";
import { regionFromAddress, visitorAddress } from "@/lib/visitor-region";

/**
 * Two jobs, both cheap, both resolved into request headers that the server
 * components read.
 *
 * 1. Region. A country header wins when the host sends one. Otherwise the
 *    visitor address nginx recorded is matched against Lebanon's prefixes.
 *    No cookie and no override: pricing is not something a visitor gets to choose.
 *
 * 2. Locale. Routes live under `app/[locale]/`, but English keeps the bare
 *    URL: `/shop`, not `/en/shop`. A rewrite (not a redirect) maps the bare
 *    path onto the `en` segment, so the address bar stays clean and the
 *    already-published links keep working. French is explicit at `/fr/...`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The admin panel lives outside app/[locale]/ entirely — its own layout,
  // no storefront chrome, no locale — so it must never be rewritten onto
  // /en/admin, which no longer exists.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  const hasLocalePrefix = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  const locale =
    LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)) ??
    DEFAULT_LOCALE;

  /* A country header wins (Vercel, Cloudflare, or nginx GeoIP). Without
     one, the address nginx recorded is matched against Lebanon's prefixes.
     Still unknown — no header and no public address — stays international. */
  const detected = detectRegion(request.headers);
  const address = detected.headerUsed ? null : visitorAddress(request.headers);
  const region = address ? regionFromAddress(address) : detected.region;
  if (!detected.headerUsed && !address && process.env.NODE_ENV === "production") {
    console.warn(
      "[zuruny] No country header and no public visitor address — pricing as INTL. " +
        "nginx must set X-Real-IP to $remote_addr.",
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
