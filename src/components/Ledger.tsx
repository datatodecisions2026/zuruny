import { SHIPS_TO, type Product } from "@/lib/catalog";
import { getDict, type Locale } from "@/lib/i18n";

/**
 * The spec strip from the tins ("100% Natural - Cold Pressed / Acidity <0.5%"),
 * promoted to a page band. Every figure is counted from the catalogue rather
 * than typed in, so it cannot drift out of date or overstate the range.
 */
export function Ledger({
  locale,
  live,
  named,
}: {
  locale: Locale;
  live: Product[];
  named: Product[];
}) {
  const t = getDict(locale);

  const villages = new Set(
    live
      .flatMap((p) => p.spec)
      .filter((s) => s.label === "Village")
      .map((s) => s.value),
  );

  const facts = [
    { figure: String(named.length), label: t.ledger.names },
    { figure: String(villages.size), label: t.ledger.villages },
    { figure: String(live.length), label: t.ledger.products },
    { figure: String(SHIPS_TO.length), label: t.ledger.countries },
  ];

  return (
    <section aria-label="Zuruny" className="px-[var(--gutter)] py-20">
      <div className="m-line h-px w-full bg-[var(--rule-strong)]" />

      <dl className="m-seq grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-4">
        {facts.map((fact, i) => (
          <div key={fact.label} style={{ ["--i" as string]: i }}>
            <dd className="u-display text-[length:var(--step-3)] text-ochre">
              {fact.figure}
            </dd>
            <dt className="u-mono mt-2 text-[var(--text-muted)]">
              {fact.label}
            </dt>
          </div>
        ))}
      </dl>

      <div className="m-line h-px w-full bg-[var(--rule)]" />

      <p className="m-rise u-measure mt-12 text-[length:var(--step-1)] leading-relaxed text-[var(--text-muted)]">
        {t.ledger.blurbBefore}
        <span className="text-cream">{t.ledger.blurbOwn}</span>.
      </p>
    </section>
  );
}
