import type { Metadata } from "next";
import { query } from "@/lib/db";
import { formatUSD } from "@/lib/catalog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Orders — Admin", robots: { index: false } };

type OrderRow = {
  reference: string;
  email: string;
  status: string;
  region: string;
  subtotal_cents: number;
  created_at: string;
};

const STATUS_VARIANT: Record<string, "default" | "accent" | "destructive"> = {
  paid: "accent",
  pending_payment: "default",
  failed: "destructive",
  cancelled: "destructive",
  shipped: "accent",
  refunded: "default",
};

/** The auth check lives in admin/layout.tsx — this page only runs once it has passed. */
export default async function AdminOrdersPage() {
  const orders = await query<OrderRow>(
    `select reference, email, status, region, subtotal_cents, created_at
       from zuruny_orders order by created_at desc limit 25`,
  );

  return (
    <div className="space-y-6">
      <h1 className="admin-display text-3xl text-foreground">Orders</h1>

      <Card>
        <CardHeader>
          <CardTitle>Most recent 25</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.reference}>
                    <TableCell className="admin-mono text-xs">{o.reference}</TableCell>
                    <TableCell>{o.email}</TableCell>
                    <TableCell className="admin-mono text-xs">{o.region}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[o.status] ?? "default"}>{o.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatUSD(o.subtotal_cents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
