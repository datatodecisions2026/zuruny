import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n";
import { REGION_COOKIE, isRegion, regionFromCountry } from "@/lib/region";

/**
 * Two jobs, both cheap:
 *
 * 1. Region. Vercel puts the visitor's country on `x-vercel-ip-country`. We
 *    turn that into a Lebanon/International cookie on first visit only, so a
 *    manual override the visitor makes later is never overwritten by geo.
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

  // The root layout owns <html lang> but never sees route params, so the
  // resolved locale rides along as a request header.
  const headers = new Headers(request.headers);
  headers.set("x-zuruny-locale", locale);

  let response: NextResponse;

  if (hasLocalePrefix) {
    response = NextResponse.next({ request: { headers } });
  } else {
    // Bare path — render it as the default locale without changing the URL.
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
    response = NextResponse.rewrite(url, { request: { headers } });
  }

  const existing = request.cookies.get(REGION_COOKIE)?.value;
  if (!isRegion(existing)) {
    const region = regionFromCountry(
      request.headers.get("x-vercel-ip-country"),
    );
    response.cookies.set(REGION_COOKIE, region, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  // Everything except Next internals and files with an extension.
  matcher: ["/((?!_next|api|.*\\.).*)"],
};
