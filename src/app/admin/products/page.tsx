import type { Metadata } from "next";
import { query } from "@/lib/db";
import { AdminProducts, type AdminProduct } from "@/components/AdminProducts";

export const metadata: Metadata = { title: "Products — Admin", robots: { index: false } };

type ProductRow = {
  id: number;
  handle: string;
  name: string;
  status: string;
  kind: string;
  description: string;
  description_fr: string | null;
  named_after_from: string | null;
  memory: string | null;
  pull_quote: string | null;
  zuruny_variants: {
    id: number;
    label: string | null;
    price_cents: number | null;
    stock: number;
    available: boolean;
    position: number;
  }[];
};

/** The auth check lives in admin/layout.tsx — this page only runs once it has passed. */
export default async function AdminProductsPage() {
  const products = await query<ProductRow>(
    `select p.id, p.handle, p.name, p.status, p.kind, p.description, p.description_fr,
            p.named_after_from, p.memory, p.pull_quote,
            coalesce((select json_agg(json_build_object(
                        'id', v.id, 'label', v.label, 'price_cents', v.price_cents,
                        'stock', v.stock, 'available', v.available, 'position', v.position))
                      from zuruny_variants v where v.product_id = p.id), '[]'::json)
              as zuruny_variants
       from zuruny_products p order by p.position`,
  );

  /* Flattened onto the first variant. Multi-size products (Najibe, Mimi) keep
     every variant in the database; this editor edits the first, which is what
     the single-size products the owner actually sells need today. */
  const editable: AdminProduct[] = products.map((p) => {
    const first = [...p.zuruny_variants].sort((a, b) => a.position - b.position)[0];
    return {
      id: p.id,
      handle: p.handle,
      name: p.name,
      kind: p.kind,
      status: p.status,
      description: p.description ?? "",
      descriptionFr: p.description_fr ?? "",
      namedAfterFrom: p.named_after_from ?? "",
      memory: p.memory ?? "",
      pullQuote: p.pull_quote ?? "",
      variantId: first?.id ?? null,
      priceCents: first?.price_cents ?? null,
      stock: first?.stock ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="admin-display text-3xl text-foreground">Products</h1>
      <AdminProducts products={editable} />
      <p className="admin-mono text-xs text-muted-foreground">
        Prices are the Lebanon base. International is calculated at checkout at 2.5&times;.
      </p>
    </div>
  );
}
