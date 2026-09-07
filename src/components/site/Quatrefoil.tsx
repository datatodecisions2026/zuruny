type Props = {
  className?: string;
  title?: string;
};

/**
 * The Zuruny emblem, taken from the brand deck (Yasmina Terzikhan, 2025).
 *
 * The deck ships flattened artwork, so this is the mark lifted as an alpha
 * mask and painted with `currentColor` — that keeps one true emblem that can
 * be tinted per context, instead of an approximation redrawn by hand.
 */
export function Quatrefoil({ className, title }: Props) {
  return (
    <span
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{
        display: "inline-block",
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/emblem.png)",
        maskImage: "url(/emblem.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

export default Quatrefoil;
