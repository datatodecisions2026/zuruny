import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getDict, isLocale, localePath } from "@/lib/i18n";
import { formatUSD } from "@/lib/catalog";
import { AdminProducts, type AdminProduct } from "@/components/AdminProducts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDict(locale).admin.title, robots: { index: false } };
}

/**
 * The owner's view.
 *
 * Two gates, deliberately: this page checks the role before rendering, and the
 * database refuses the rows anyway if the check were ever wrong. The RLS
 * policies are the real boundary — this redirect is only there so a customer
 * gets a sensible page instead of an empty table.
 */
export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, "/account"));
  if (!user.isAdmin) {
    return (
      <main
        id="main"
        className="min-h-[70svh] px-[var(--gutter)] pb-24 pt-40 sm:pt-36"
      >
        <h1 className="u-display text-[length:var(--step-3)] text-cream">
          {t.admin.title}
        </h1>
        <p className="u-measure mt-6 text-[var(--text-muted)]">
          {t.admin.notAllowed}
        </p>
        <Link
          href={localePath(locale, "/account")}
          className="u-mono u-underline mt-8 inline-block text-ochre"
        >
          {t.account.title} &rarr;
        </Link>
      </main>
    );
  }

  const supabase = await getSupabaseServer();

  const { data: products } = (await supabase
    ?.from("zuruny_products")
    .select(
      "id, handle, name, status, kind, description, description_fr, " +
        "zuruny_variants(id, label, price_cents, stock, available, position)",
    )
    .order("position")) ?? { data: null };

  const { data: orders } = (await supabase
    ?.from("zuruny_orders")
    .select("reference, email, status, region, subtotal_cents, created_at")
    .order("created_at", { ascending: false })
    .limit(25)) ?? { data: null };

  type ProductRow = {
    id: number;
    handle: string;
    name: string;
    status: string;
    kind: string;
    description: string;
    description_fr: string | null;
    zuruny_variants: {
      id: number;
      label: string | null;
      price_cents: number | null;
      stock: number;
      available: boolean;
      position: number;
    }[];
  };
  type OrderRow = {
    reference: string;
    email: string;
    status: string;
    region: string;
    subtotal_cents: number;
    created_at: string;
  };

  const productRows = (products as ProductRow[] | null) ?? [];

  /* Flattened onto the first variant. Multi-size products (Najibe, Mimi) keep
     every variant in the database; this editor edits the first, which is what
     the single-size products the owner actually sells need today. */
  const editable: AdminProduct[] = productRows.map((p) => {
    const first = [...p.zuruny_variants].sort((a, b) => a.position - b.position)[0];
    return {
      id: p.id,
      handle: p.handle,
      name: p.name,
      kind: p.kind,
      status: p.status,
      description: p.description ?? "",
      descriptionFr: p.description_fr ?? "",
      variantId: first?.id ?? null,
      priceCents: first?.price_cents ?? null,
      stock: first?.stock ?? 0,
    };
  });
  const orderRows = (orders as OrderRow[] | null) ?? [];

  return (
    <main
      id="main"
      className="min-h-[70svh] px-[var(--gutter)] pb-[clamp(4rem,10vh,8rem)] pt-40 sm:pt-36"
    >
      <h1 className="u-display text-[length:var(--step-3)] text-cream">
        {t.admin.title}
      </h1>
      <p className="u-mono mt-3 text-[var(--text-faint)]">
        {user.email}
      </p>

      <section className="mt-14">
        <h2 className="u-display mb-6 text-[length:var(--step-2)] text-cream">
          {t.admin.orders}
        </h2>
        {orderRows.length === 0 ? (
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
                {orderRows.map((o) => (
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

      <section className="mt-16">
        <h2 className="u-display mb-6 text-[length:var(--step-2)] text-cream">
          {t.admin.products}
        </h2>
        <AdminProducts products={editable} />
        <p className="u-mono mt-6 text-[var(--text-faint)]">
          Prices are the Lebanon base. International is calculated at checkout
          at 2.5&times;.
        </p>
      </section>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="u-mono py-3 pr-6 font-medium text-[var(--text-muted)]">
      {children}
    </th>
  );
}

function Td({
  children,
  mono,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <td className={`py-3 pr-6 text-cream ${mono ? "u-mono" : ""}`}>
      {children}
    </td>
  );
}
