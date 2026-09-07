"use client";

import { useEffect, useState } from "react";
import CircularGallery from "@/components/CircularGallery";
import ScrollReveal from "@/components/ScrollReveal";
import { range } from "@/data/site";

export function Range() {
  const [narrow, setNarrow] = useState(false);
  const [drift, setDrift] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setNarrow(mq.matches);
      setDrift(rm.matches ? 0 : 0.018);
    };
    sync();
    mq.addEventListener("change", sync);
    rm.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      rm.removeEventListener("change", sync);
    };
  }, []);

  return (
    <section id="range" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <ScrollReveal
          enableBlur
          baseOpacity={0.18}
          baseRotation={0}
          blurStrength={4}
          containerClassName="!my-0"
          textClassName="u-display !text-[clamp(1.5rem,3.6vw,2.6rem)] !font-normal !leading-[1.3] text-char"
        >
          Six things, made in Lebanon. One press per village, nothing blended
          into anonymity.
        </ScrollReveal>
      </div>

      <div className="mt-6 h-[340px] w-full sm:mt-8 sm:h-[500px]">
        <CircularGallery
          items={range}
          bend={narrow ? 1 : 2.2}
          textColor="#241611"
          borderRadius={0}
          font={narrow ? "500 17px Cinzel, serif" : "500 24px Cinzel, serif"}
          scrollSpeed={1.6}
          scrollEase={0.06}
          autoScroll={drift}
        />
      </div>

      <p className="mx-auto mt-4 max-w-6xl px-6 text-sm text-char-soft sm:px-10">
        It drifts on its own. Drag to move faster.
      </p>
    </section>
  );
}

export default Range;
