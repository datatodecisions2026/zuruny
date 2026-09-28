import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthForms } from "@/components/AuthForms";
import { SignOutButton } from "@/components/SignOutButton";
import { getSessionUser } from "@/lib/auth";
import { getMyOrders } from "@/lib/orders";
import { supabaseConfigured } from "@/lib/supabase/server";
import { getDict, isLocale, localePath } from "@/lib/i18n";
import { formatUSD } from "@/lib/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDict(locale).account.title, robots: { index: false } };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  if (!supabaseConfigured) {
    return (
      <Shell title={t.account.title}>
        <p className="u-measure text-[var(--text-muted)]">
          {t.account.notConfigured}
        </p>
      </Shell>
    );
  }

  const user = await getSessionUser();

  if (!user) {
    return (
      <main
        id="main"
        className="grid items-stretch gap-16 px-[var(--gutter)] pb-[clamp(4rem,10vh,8rem)] pt-36 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-[clamp(4rem,8vw,9rem)]"
      >
        <div>
          <p className="m-intro-item u-mono flex items-center gap-3 text-ochre">
            <span
              aria-hidden
              className="u-emblem size-5"
              style={{ ["--emblem-src" as string]: "url(/brand/emblem.png)" }}
            />
            {t.account.eyebrow}
          </p>
          <h1 className="m-intro-item u-display mb-6 mt-6 text-[length:var(--step-3)] text-cream">
            {t.account.title}
          </h1>
          <p className="mb-12 text-[var(--text-muted)]">{t.account.whyAccount}</p>
          <AuthForms />
        </div>

        {/* The tins sit on a black sweep, so `contain` lets the frame run to
            any height without cropping a label. */}
        <figure className="m-intro-item relative hidden min-h-[40rem] overflow-hidden bg-[#060606] lg:block" style={{ ["--i" as string]: 3 }}>
          <Image
            src="/products/malvina-2.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-contain p-10 [mask-image:radial-gradient(ellipse_45%_60%_at_center,#000_70%,transparent)]"
          />
          <span aria-hidden className="pointer-events-none absolute inset-4 border border-[var(--rule)]" />
          <figcaption className="u-mono absolute inset-x-8 bottom-8 flex items-center justify-between gap-6 text-[var(--text-muted)]">
            <span>{t.account.caption}</span>
            <span className="text-ochre">01 — 05</span>
          </figcaption>
        </figure>
      </main>
    );
  }

  const orders = await getMyOrders();

  const statusLabel: Record<string, string> = {
    pending_payment: t.account.statusPendingPayment,
    paid: t.account.statusPaid,
    failed: t.account.statusFailed,
    cancelled: t.account.statusCancelled,
    shipped: t.account.statusShipped,
    refunded: t.account.statusRefunded,
  };

  return (
    <Shell title={t.account.title}>
      <div className="mb-14 flex flex-wrap items-center justify-between gap-6 border-b border-[var(--rule)] pb-8">
        <div>
          <p className="u-mono text-[var(--text-muted)]">
            {t.account.signedInAs(user.email ?? "")}
          </p>
          {user.isAdmin && (
            <Link
              href={localePath(locale, "/admin")}
              className="u-mono u-underline mt-2 inline-block text-ochre"
            >
              {t.nav.admin} &rarr;
            </Link>
          )}
        </div>
        <SignOutButton />
      </div>

      <h2 className="u-display mb-8 text-[length:var(--step-2)] text-cream">
        {t.account.orders}
      </h2>

      {orders.length === 0 ? (
        <p className="text-[var(--text-muted)]">{t.account.noOrders}</p>
      ) : (
        <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
          {orders.map((order) => (
            <li key={order.reference} className="m-rise py-7">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="u-mono text-cream">{order.reference}</p>
                  <p className="u-mono mt-1 text-[var(--text-faint)]">
                    {new Date(order.created_at).toLocaleDateString(
                      locale === "fr" ? "fr-FR" : "en-GB",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="u-display text-[length:var(--step-1)] text-cream">
                    {formatUSD(order.subtotal_cents)}
                  </p>
                  <p className="u-mono mt-1 text-ochre">
                    {statusLabel[order.status] ?? order.status}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-1">
                {order.zuruny_order_items.map((item, i) => (
                  <li
                    key={`${order.reference}-${i}`}
                    className="u-mono text-[var(--text-muted)]"
                  >
                    {item.qty} &times; {item.product_name}
                    {item.variant_label ? ` (${item.variant_label})` : ""} &middot;{" "}
                    {formatUSD(item.line_total_cents)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Shell>
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
      <h1 className="m-intro-item u-display mb-10 text-[length:var(--step-3)] text-cream">
        {title}
      </h1>
      {children}
    </main>
  );
}

export const dynamic = "force-dynamic";
