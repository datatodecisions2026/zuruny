import type { Metadata } from "next";
import { getDashboardStats, getRevenueLast6Months, getTopProductsByUnits } from "@/lib/admin-dashboard";
import { formatUSD } from "@/lib/catalog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { TopProducts } from "@/components/admin/TopProducts";

export const metadata: Metadata = { title: "Dashboard — Admin", robots: { index: false } };

/** The auth check lives in admin/layout.tsx — this page only runs once it has passed. */
export default async function AdminDashboardPage() {
  const [stats, revenue, topProducts] = await Promise.all([
    getDashboardStats(),
    getRevenueLast6Months(),
    getTopProductsByUnits(),
  ]);

  const avgValue = stats.unitsInStock > 0 ? stats.capitalCents / stats.unitsInStock : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="admin-display text-3xl text-foreground">Dashboard</h1>
        <p className="admin-mono mt-1 text-xs text-muted-foreground">Overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total orders" value={stats.totalOrders} />
        <Stat label="Pending" value={stats.pending} />
        <Stat label="Revenue" value={formatUSD(stats.revenueCents)} />
        <Stat label="Customers" value={stats.customers} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory capital</CardTitle>
          <p className="text-sm text-muted-foreground">
            Retail value tied up in stock on hand — list price × quantity across every product
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="admin-mono text-xs text-muted-foreground">Total capital in stock</p>
            <p className="admin-display mt-1 text-2xl text-foreground">{formatUSD(stats.capitalCents)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Projected gross if all current stock sells at list price</p>
          </div>
          <div>
            <p className="admin-mono text-xs text-muted-foreground">Units in stock</p>
            <p className="admin-display mt-1 text-2xl text-foreground">{stats.unitsInStock.toLocaleString()}</p>
            <p className="mt-3 admin-mono text-xs text-muted-foreground">Avg value / unit</p>
            <p className="mt-1 text-foreground">{formatUSD(Math.round(avgValue))}</p>
          </div>
          <div>
            <p className="admin-mono text-xs text-muted-foreground">Products stocked</p>
            <p className="admin-display mt-1 text-2xl text-foreground">
              {stats.productsStocked}{" "}
              <span className="admin-mono text-xs font-normal text-muted-foreground">
                {stats.productsOutOfStock} out of stock
              </span>
            </p>
            <p className="mt-3 admin-mono text-xs text-muted-foreground">Revenue + capital</p>
            <p className="mt-1 text-foreground">{formatUSD(stats.revenueCents + stats.capitalCents)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue — last 6 months</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top products by units sold</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProducts data={topProducts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="admin-display text-3xl text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
