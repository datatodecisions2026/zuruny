import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartView } from "@/components/CartView";
import { getDict, isLocale } from "@/lib/i18n";
import { paystackConfigured } from "@/lib/paystack";
import { getSessionUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDict(locale).cart.title, robots: { index: false } };
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getSessionUser();
  return (
    <CartView paymentLive={paystackConfigured()} signedIn={Boolean(user)} />
  );
}
