import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { CartProvider } from "@/lib/cart";
import { PreferencesProvider } from "@/lib/preferences";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartDrawer } from "@/components/CartDrawer";
import { LOCALES, isLocale } from "@/lib/i18n";
import { getLiveProducts } from "@/lib/products";
import { REGION_HEADER, isRegion, type Region } from "@/lib/region";

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

  // Detected per request by the proxy from the visitor's country. Not a
  // preference, so there is nothing to persist and nothing to override.
  const headerRegion = (await headers()).get(REGION_HEADER);
  const region: Region = isRegion(headerRegion) ? headerRegion : "INTL";
  const products = await getLiveProducts();

  return (
    <PreferencesProvider locale={locale} region={region}>
      <CartProvider products={products}>
        <SiteHeader locale={locale} region={region} />
        {children}
        <SiteFooter locale={locale} />
        <CartDrawer />
      </CartProvider>
    </PreferencesProvider>
  );
}
