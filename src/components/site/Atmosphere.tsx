"use client";

import ClickSpark from "@/components/ClickSpark";

/**
 * The page ground.
 *
 * The brand deck ships three patterns; the small leaf sprig is the one built
 * for a field rather than a panel, so it tiles behind everything at very low
 * contrast. It replaces the generic film grain that was here before — same job,
 * but it is actually the brand's own artwork.
 *
 * Tinted with `currentColor` so it follows whichever palette is applied.
 */
export function Atmosphere({ children }: { children: React.ReactNode }) {
  return (
    <ClickSpark
      sparkColor="#611217"
      sparkSize={7}
      sparkRadius={16}
      sparkCount={6}
      duration={420}
      easing="ease-out"
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 text-oxblood opacity-[0.038]"
        style={{
          backgroundColor: "currentColor",
          WebkitMaskImage: "url(/pattern-sprig.png)",
          maskImage: "url(/pattern-sprig.png)",
          WebkitMaskSize: "150px auto",
          maskSize: "150px auto",
          WebkitMaskRepeat: "repeat",
          maskRepeat: "repeat",
        }}
      />
      <div className="relative z-10">{children}</div>
    </ClickSpark>
  );
}

export default Atmosphere;
