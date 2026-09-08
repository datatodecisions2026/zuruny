import { namedProducts } from "@/lib/catalog";

/**
 * An endless strip of the names.
 *
 * The rejected build had a *curved* marquee running Arabic text, which is out
 * on both counts — the kit bans Arabic outright and the curve was one of five
 * competing set-pieces. This is a straight band running the one thing the
 * brand owns: the names of the people the jars are named after.
 *
 * The track holds the list twice and translates -50%, so the wrap is seamless
 * with no measuring and no JavaScript. It pauses on hover.
 */
export function NameMarquee() {
  const names = namedProducts.map((p) => p.name);
  // Repeated so the track is wide enough to cover a large viewport.
  const half = [...names, ...names, ...names];

  return (
    <section
      aria-label="The names"
      className="m-marquee relative overflow-hidden border-y border-[var(--rule)] py-10"
    >
      <div
        className="m-marquee-track flex w-max"
        style={{ ["--marquee-duration" as string]: "38s" }}
      >
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 items-center"
          >
            {half.map((name, i) => (
              <li
                key={`${copy}-${i}`}
                className="flex shrink-0 items-center gap-[clamp(2rem,5vw,5rem)] pr-[clamp(2rem,5vw,5rem)]"
              >
                <span className="u-display text-[length:var(--step-3)] whitespace-nowrap text-cream/85">
                  {name}
                </span>
                <span
                  aria-hidden
                  className="u-emblem size-6 shrink-0 text-ochre"
                  style={{
                    ["--emblem-src" as string]: "url(/brand/emblem.png)",
                  }}
                />
              </li>
            ))}
          </ul>
        ))}
      </div>

      {/* Feathered edges so names enter and leave rather than being chopped. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ground to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ground to-transparent"
      />
    </section>
  );
}
