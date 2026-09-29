import "server-only";
import { query } from "@/lib/db";

export type DashboardStats = {
  totalOrders: number;
  pending: number;
  revenueCents: number;
  customers: number;
  capitalCents: number;
  unitsInStock: number;
  productsStocked: number;
  productsOutOfStock: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [orderRow] = await query<{ total: number; pending: number; revenue: number; customers: number }>(
    `select
       (select count(*) from zuruny_orders) as total,
       (select count(*) from zuruny_orders where status = 'pending_payment') as pending,
       (select coalesce(sum(subtotal_cents), 0) from zuruny_orders where status = 'paid') as revenue,
       (select count(*) from zuruny_users where role = 'customer') as customers`,
  );

  const [stockRow] = await query<{ capital: number; units: number }>(
    `select coalesce(sum(price_cents * stock), 0) as capital, coalesce(sum(stock), 0) as units
       from zuruny_variants where price_cents is not null`,
  );

  const [productRow] = await query<{ stocked: number; out_of_stock: number }>(
    `select
       count(*) filter (where total_stock > 0) as stocked,
       count(*) filter (where total_stock = 0) as out_of_stock
     from (select product_id, sum(stock) as total_stock from zuruny_variants group by product_id) v`,
  );

  return {
    totalOrders: orderRow?.total ?? 0,
    pending: orderRow?.pending ?? 0,
    revenueCents: orderRow?.revenue ?? 0,
    customers: orderRow?.customers ?? 0,
    capitalCents: stockRow?.capital ?? 0,
    unitsInStock: stockRow?.units ?? 0,
    productsStocked: productRow?.stocked ?? 0,
    productsOutOfStock: productRow?.out_of_stock ?? 0,
  };
}

export type MonthlyRevenue = { month: string; cents: number };

/** Always 6 points, oldest first, zero-filled — a month with no paid orders is 0, not missing. */
export async function getRevenueLast6Months(): Promise<MonthlyRevenue[]> {
  const rows = await query<{ month: string; cents: number }>(
    `select to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
            sum(subtotal_cents) as cents
       from zuruny_orders
      where status = 'paid' and created_at >= now() - interval '6 months'
      group by 1`,
  );
  const byMonth = new Map(rows.map((r) => [r.month, r.cents]));

  const out: MonthlyRevenue[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    out.push({ month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), cents: byMonth.get(key) ?? 0 });
  }
  return out;
}

export type ProductUnits = { name: string; units: number };

export async function getTopProductsByUnits(limit = 6): Promise<ProductUnits[]> {
  return query<ProductUnits>(
    `select i.product_name as name, sum(i.qty)::int as units
       from zuruny_order_items i join zuruny_orders o on o.id = i.order_id
      where o.status = 'paid'
      group by i.product_name
      order by units desc
      limit $1`,
    [limit],
  );
}
