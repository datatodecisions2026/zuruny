import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { verifyTransaction, paystackConfigured } from "@/lib/paystack";
import { getSessionUser } from "@/lib/auth";
import { getDict, isLocale, localePath } from "@/lib/i18n";
import { formatUSD } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false } };

/**
 * Where Paystack sends the customer back to.
 *
 * The redirect alone proves nothing — anyone can open this URL. So the page
 * asks Paystack directly what happened, and shows the answer. The order's
 * `paid` state is still only written by the webhook; this page reports, it
 * does not decide.
 */
export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; reference: string }>;
}) {
  const { locale, reference } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  const user = await getSessionUser();
  const supabase = await getSupabaseServer();

  // RLS means this returns nothing unless the order belongs to this user.
  const { data: order } = (await supabase
    ?.from("zuruny_orders")
    .select("reference, status, subtotal_cents, created_at")
    .eq("reference", reference)
    .maybeSingle()) ?? { data: null };

  if (!user || !order) {
    return (
      <Shell title={t.order.notFoundTitle}>
        <p className="u-measure text-[var(--text-muted)]">
          {t.order.notFoundBody}
        </p>
        <Link
          href={localePath(locale, "/account")}
          className="u-mono u-underline mt-8 inline-block text-ochre"
        >
          {t.account.title} &rarr;
        </Link>
      </Shell>
    );
  }

  let live: string | null = null;
  if (paystackConfigured() && order.status === "pending_payment") {
    try {
      const verified = await verifyTransaction(reference);
      live = verified.paid ? "paid" : verified.status;
    } catch {
      live = null;
    }
  }

  const settled = order.status === "paid" || live === "paid";

  return (
    <Shell title={settled ? t.order.thanksTitle : t.order.pendingTitle}>
      <p className="u-measure text-[var(--text-muted)]">
        {settled ? t.order.thanksBody : t.order.pendingBody}
      </p>

      <dl className="mt-10 grid max-w-md gap-px border border-[var(--rule)] bg-[var(--rule)]">
        <Row label={t.account.orderRef} value={order.reference} mono />
        <Row label={t.account.orderTotal} value={formatUSD(order.subtotal_cents)} />
        <Row
          label={t.admin.status}
          value={settled ? t.account.statusPaid : t.account.statusPendingPayment}
        />
      </dl>

      <Link
        href={localePath(locale, "/account")}
        className="u-mono mt-10 inline-block bg-cream px-7 py-4 text-ground transition-colors duration-300 hover:bg-ochre"
      >
        {t.account.orders}
      </Link>
    </Shell>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 bg-ground px-5 py-4">
      <dt className="u-mono text-[var(--text-faint)]">{label}</dt>
      <dd className={`text-cream ${mono ? "u-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function Shell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main
      id="main"
      className="min-h-[70svh] px-[var(--gutter)] pb-[clamp(4rem,10vh,8rem)] pt-40 sm:pt-36"
    >
      <h1 className="m-intro-item u-display mb-8 text-[length:var(--step-3)] text-cream">
        {title}
      </h1>
      {children}
    </main>
  );
}
