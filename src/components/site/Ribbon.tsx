"use client";

import CurvedLoop from "@/components/CurvedLoop";

export function Ribbon() {
  return (
    <div
      aria-hidden
      className="relative overflow-hidden border-y border-bronze/15 bg-paper-deep py-1 text-bronze/55"
    >
      <CurvedLoop
        marqueeText="زوروني ✦ come visit me ✦"
        speed={0.7}
        curveAmount={44}
        direction="left"
        interactive={false}
        className="u-display fill-current !text-[1.6rem] !font-normal !tracking-[0.2em]"
      />
    </div>
  );
}

export default Ribbon;
