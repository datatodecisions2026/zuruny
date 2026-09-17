import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { KineticHeading } from "@/components/KineticHeading";
import type { Product } from "@/lib/catalog";
import { getDict, localePath, type Locale } from "@/lib/i18n";
import type { Region } from "@/lib/region";

/**
 * The made things — carafes and cedar. No memory attached to these, and the
 * site should not pretend otherwise, so they get a different grammar from the
 * roll call: tighter, gridded, more shop than story.
 */
export function Objects({
  locale,
  region,
  products,
}: {
  locale: Locale;
  region: Region;
  products: Product[];
}) {
  const t = getDict(locale);

  return (
    <section
      id="objects"
      className="scroll-mt-24 border-t border-[var(--rule)] px-[var(--gutter)] py-[clamp(4rem,10vh,8rem)]"
    >
      <header className="mb-16 flex flex-wrap items-end justify-between gap-6">
        <div>
          <KineticHeading
            mode="scroll"
            text={t.objects.title}
            className="u-display text-[length:var(--step-3)] text-cream"
          />
          <p className="m-rise u-measure mt-5 text-[var(--text-muted)]">
            {t.objects.sub}
          </p>
        </div>
        <Link
          href={localePath(locale, "/shop")}
          className="m-rise u-mono u-underline text-[var(--text-muted)] transition-colors duration-300 hover:text-cream"
        >
          {t.objects.seeAll(products.length)}
        </Link>
      </header>

      <ul className="m-seq grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, i) => (
          <li key={product.handle} style={{ ["--i" as string]: i }}>
            <ProductCard product={product} locale={locale} region={region} />
          </li>
        ))}
      </ul>
    </section>
  );
}
