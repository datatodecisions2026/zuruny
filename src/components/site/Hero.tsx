"use client";

import MorphSlider from "@/components/MorphSlider";
import SplitText from "@/components/SplitText";
import { Quatrefoil } from "./Quatrefoil";
import { hero } from "@/data/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-32 sm:px-10 lg:px-16 lg:pb-28 lg:pt-40">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
        <div>
          <Quatrefoil className="mb-8 hidden h-11 w-11 text-bronze sm:block" />

          {/* dir="rtl" would right-align this away from the wordmark it sits
              above, so the block stays left-aligned while the text runs RTL. */}
          <p lang="ar" dir="rtl" className="mb-2 text-left">
            <span className="inline-block text-3xl text-oxblood sm:text-4xl">
              زوروني
            </span>
          </p>

          <SplitText
            tag="h1"
            text="Zuruny"
            className="u-display block text-[clamp(3.25rem,9vw,7rem)] text-char"
            splitType="chars"
            delay={70}
            duration={1.1}
            ease="power3.out"
            from={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            to={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            textAlign="left"
          />

          <div className="u-rule my-7 max-w-sm" />

          <p className="u-measure text-lg text-char/80 sm:text-xl">
            It means <em>come visit me</em> — the thing every Lebanese
            grandmother says at the end of a phone call. We put it on tins of
            olive oil so it can travel further than she can.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-5">
            <a
              href="/shop"
              className="bg-oxblood px-8 py-4 text-sm tracking-[0.14em] text-paper transition-colors duration-300 hover:bg-oxblood-deep"
            >
              Shop the oils
            </a>
            <a
              href="#names"
              className="py-4 text-sm tracking-[0.14em] text-bronze underline decoration-bronze/40 underline-offset-8 transition-colors duration-300 hover:text-char"
            >
              Meet the names
            </a>
          </div>
        </div>

        {/* The photography is dark and studio-lit, so it hangs on the cream as
            a framed plate rather than bleeding to the page edges under a scrim
            that the cream ground would have fought. */}
        <figure className="relative">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-bronze/25 bg-paper-deep shadow-[0_40px_80px_-50px_rgba(36,22,17,0.55)]">
            <MorphSlider
              items={hero}
              transition="melt"
              duration={1.6}
              intensity={0.42}
              autoplay
              autoplayDelay={5200}
              loop
              radius={0}
              showCaptions={false}
              showControls={false}
              showIndicators={false}
              className="h-full w-full"
            />
          </div>
          <figcaption className="u-spec mt-3 text-char-soft">
            Pressed in Lebanon · shipped to 29 countries
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export default Hero;
