import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getProducts, money } from "@/lib/catalog";
import TopBar from "@/components/site/TopBar";
import { Quatrefoil } from "@/components/site/Quatrefoil";

// Catalogue edits made through the CMS revalidate immediately; this is the
// backstop for changes made straight in the database.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shop — Zuruny",
  description:
    "Single-origin Lebanese olive oil, carob and grape molasses, ceramic carafes and cedar coasters. Shipped from Beirut to 29 countries.",
};

export default async function ShopPage() {
  const products = await getProducts();
  const oils = products.filter((p) => p.kind === "Olive oil");
  const molasses = products.filter((p) => p.kind.includes("molasses"));
  const objects = products.filter(
    (p) => p.kind === "Carafe" || p.kind === "Coaster",
  );

  const groups = [
    { title: "Olive oil", items: oils },
    { title: "Molasses", items: molasses },
    { title: "For the table", items: objects },
  ];

  return (
    <>
      <TopBar />
    <main className="px-6 pb-24 pt-28 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm tracking-[0.14em] text-char-soft underline decoration-bronze/30 underline-offset-8 transition-colors hover:text-char"
        >
          Back to Zuruny
        </Link>

        <h1 className="u-display mt-8 text-[clamp(2.25rem,6vw,4rem)] text-char">
          Everything we make
        </h1>
        <p className="u-measure mt-5 text-lg text-char/75">
          Pressed, poured and packed in Lebanon. Prices in USD; shipping is
          worked out at checkout.
        </p>

        {groups.map((group) =>
          group.items.length === 0 ? null : (
            <section key={group.title} className="mt-16">
              <h2 className="u-display text-lg text-bronze">
                {group.title}
              </h2>
              <div className="u-rule mt-3" />

              <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-3">
                {group.items.map((p) => {
                  const from = p.variants
                    .filter((v) => v.priceCents > 0)
                    .sort((a, b) => a.priceCents - b.priceCents)[0];
                  const anyAvailable = p.variants.some((v) => v.available);

                  return (
                    <li key={p.handle}>
                      <Link href={`/products/${p.handle}`} className="group block">
                        <div className="relative aspect-[3/4] overflow-hidden border border-bronze/20 bg-paper-deep">
                          {p.images[0] ? (
                            <Image
                              src={p.images[0]}
                              alt={`${p.name}, ${p.kind.toLowerCase()}`}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-oxblood-deep">
                              <Quatrefoil className="h-20 w-20 text-gold/50" />
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-baseline justify-between gap-4">
                          <h3 className="u-display text-xl text-char">{p.name}</h3>
                          <span className="u-spec text-bronze/90">
                            {p.unpriced
                              ? "Soon"
                              : from
                                ? p.variants.length > 1
                                  ? `From ${money(from.priceCents)}`
                                  : money(from.priceCents)
                                : "—"}
                          </span>
                        </div>

                        <p className="u-spec mt-1 text-char-soft">
                          {p.kind}
                          {!p.unpriced && !anyAvailable ? " · sold out" : ""}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
        )}
      </div>
    </main>
    </>
  );
}
