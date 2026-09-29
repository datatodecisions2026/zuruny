import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { getDict, isLocale } from "@/lib/i18n";
import { formatUSD } from "@/lib/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDict(locale).admin.title, robots: { index: false } };
}

type OrderRow = {
  reference: string;
  email: string;
  status: string;
  region: string;
  subtotal_cents: number;
  created_at: string;
};

/** The auth check lives in admin/layout.tsx — this page only runs once it has passed. */
export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  const orders = await query<OrderRow>(
    `select reference, email, status, region, subtotal_cents, created_at
       from zuruny_orders order by created_at desc limit 25`,
  );

  return (
    <section>
      <h2 className="u-display mb-6 text-[length:var(--step-2)] text-cream">{t.admin.orders}</h2>
      {orders.length === 0 ? (
        <p className="text-[var(--text-muted)]">{t.account.noOrders}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse">
            <thead>
              <tr className="border-b border-[var(--rule-strong)] text-left">
                <Th>{t.account.orderRef}</Th>
                <Th>{t.admin.customer}</Th>
                <Th>{t.region.label}</Th>
                <Th>{t.admin.status}</Th>
                <Th>{t.account.orderTotal}</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.reference} className="border-b border-[var(--rule)]">
                  <Td mono>{o.reference}</Td>
                  <Td>{o.email}</Td>
                  <Td mono>{o.region}</Td>
                  <Td mono>{o.status}</Td>
                  <Td>{formatUSD(o.subtotal_cents)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="u-mono py-3 pr-6 font-medium text-[var(--text-muted)]">{children}</th>;
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <td className={`py-3 pr-6 text-cream ${mono ? "u-mono" : ""}`}>{children}</td>;
}
