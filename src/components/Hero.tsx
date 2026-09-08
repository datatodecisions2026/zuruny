import Image from "next/image";
import Link from "next/link";
import { KineticHeading } from "@/components/KineticHeading";

/**
 * The pour shot, full bleed. IMAGES.txt calls bri2-zeit-3 "the most alive
 * image in the whole set — a hand, movement, the actual oil", so it opens.
 *
 * Motion: the photograph drifts against the scroll inside a clipped frame,
 * and the headline sets itself line by line. Two uses of one primitive.
 */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/products/bri2-zeit-3.png"
          alt="Olive oil poured from a Bri' Zeit ceramic carafe into a coupe glass against an oxblood ground"
          fill
          priority
          sizes="100vw"
          className="m-drift m-zoom object-cover object-[62%_center] md:object-[center_38%]"
          style={{ ["--drift" as string]: "5%" }}
        />
        {/* Legibility floor. The photograph keeps its shadows; the type sits
            on a gradient rather than on a scrim box. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ground via-ground/55 to-ground/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-ground/85 via-transparent to-transparent" />
      </div>

      <div className="m-intro px-[var(--gutter)] pb-[clamp(3rem,9vh,6rem)] pt-32">
        <p className="u-mono mb-6 text-ochre" style={{ ["--i" as string]: 0 }}>
          Zuruny &middot; Beirut, Lebanon
        </p>

        <div style={{ ["--i" as string]: 1 }}>
          <KineticHeading
            as="h1"
            text="Named after the people we come from."
            className="u-display max-w-[16ch] text-[length:var(--step-4)] text-cream"
          />
        </div>

        <p
          className="u-measure mt-8 text-[length:var(--step-1)] leading-relaxed text-[var(--text-muted)]"
          style={{ ["--i" as string]: 2 }}
        >
          Single-origin olive oil and molasses, pressed in named villages in
          Lebanon. Each one carries the name of someone in our family — and
          their story, in our own words.
        </p>

        <div
          className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
          style={{ ["--i" as string]: 3 }}
        >
          <Link
            href="/shop"
            className="group inline-flex items-center gap-3 bg-cream px-7 py-4 text-ground transition-colors duration-300 hover:bg-ochre"
          >
            <span className="u-mono">Shop everything</span>
            <span
              aria-hidden
              className="transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </Link>
          <a
            href="#names"
            className="u-mono u-underline text-[var(--text-muted)] transition-colors duration-300 hover:text-cream"
          >
            Meet the names
          </a>
        </div>
      </div>
    </section>
  );
}
