import { SHIPS_TO } from "@/lib/catalog";
import { getDict, type Locale } from "@/lib/i18n";

/**
 * Most sites bury shipping reach in the footer as a sentence. For a brand
 * whose audience is a diaspora, the list of countries *is* the message — so
 * it gets a section, and every name arrives on its own beat.
 */
export function Reach({
  locale,
  standalone = false,
}: {
  locale: Locale;
  standalone?: boolean;
}) {
  const t = getDict(locale);
  const Heading = standalone ? "h1" : "h2";

  return (
    <section
      id="reach"
      className={`relative isolate scroll-mt-24 overflow-hidden px-[var(--gutter)] pb-[clamp(4rem,10vh,8rem)] ${
        standalone
          ? "min-h-[70svh] pt-52 sm:pt-44 lg:pt-40"
          : "border-t border-[var(--rule)] pt-[clamp(4rem,10vh,8rem)]"
      }`}
    >
      <div className="u-sprig absolute inset-0 -z-10" aria-hidden />

      <Heading className="m-rise u-display u-measure text-[length:var(--step-3)] text-cream">
        {t.reach.title(SHIPS_TO.length)}
      </Heading>
      <p className="m-rise u-measure mt-5 text-[var(--text-muted)]">
        {t.reach.sub}
      </p>

      <ul className="m-seq mt-16 flex flex-wrap gap-x-3 gap-y-4">
        {SHIPS_TO.map((country, i) => (
          <li
            key={country}
            /* The stagger is capped. Uncapped, the last entries in a 29-item
               list push their animation range past the end of the document
               and never finish revealing — they sit permanently at ~0.4
               opacity because the page runs out of scroll first. */
            style={{ ["--i" as string]: Math.min(i, 12) * 0.18 }}
            className="u-mono border border-[var(--rule)] px-3 py-2 text-[var(--text-muted)] transition-colors duration-300 hover:border-ochre hover:text-ochre"
          >
            {country}
          </li>
        ))}
      </ul>
    </section>
  );
}
