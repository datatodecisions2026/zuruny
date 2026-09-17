import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n";
import { REGION_HEADER, regionFromCountry } from "@/lib/region";

/**
 * Two jobs, both cheap, both resolved into request headers that the server
 * components read.
 *
 * 1. Region. Vercel puts the visitor's country on `x-vercel-ip-country`. That
 *    becomes Lebanon or International here, once, and there is no cookie and
 *    no override: pricing is not something a visitor gets to choose.
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

  const region = regionFromCountry(request.headers.get("x-vercel-ip-country"));

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
