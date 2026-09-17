import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { CartProvider } from "@/lib/cart";
import { PreferencesProvider } from "@/lib/preferences";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartDrawer } from "@/components/CartDrawer";
import { LOCALES, isLocale } from "@/lib/i18n";
import { REGION_COOKIE, isRegion, type Region } from "@/lib/region";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Written by the proxy from the visitor's country on first request, and
  // overwritten only when the visitor picks a region themselves.
  const cookieRegion = (await cookies()).get(REGION_COOKIE)?.value;
  const region: Region = isRegion(cookieRegion) ? cookieRegion : "INTL";

  return (
    <PreferencesProvider locale={locale} region={region}>
      <CartProvider>
        <SiteHeader locale={locale} region={region} />
        {children}
        <SiteFooter locale={locale} />
        <CartDrawer />
      </CartProvider>
    </PreferencesProvider>
  );
}
