import { createElement } from "react";

/**
 * A heading whose characters arrive one at a time.
 *
 * No hooks and no client bundle: the split is done at render and the stagger
 * is a per-character CSS custom property, so this ships as plain HTML with
 * a delay on each span.
 *
 * `mode`:
 *   "intro"  — plays on load. For headings that are already on screen.
 *   "scroll" — plays on a view() timeline. For headings below the fold.
 *
 * The animated spans are hidden from assistive tech and the real string is
 * carried on aria-label, so a screen reader hears one heading, not a stream
 * of single letters.
 */
export function KineticHeading({
  text,
  as = "h2",
  className = "",
  mode = "intro",
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  mode?: "intro" | "scroll";
}) {
  const words = text.split(" ");
  let charIndex = 0;

  const children = words.flatMap((word, w) => {
    const chars = [...word].map((ch) => {
      const i = charIndex++;
      return (
        <span
          key={`${w}-${i}`}
          className="m-char"
          style={{ ["--i" as string]: i }}
        >
          {ch}
        </span>
      );
    });
    charIndex++; // the space between words keeps its place in the stagger

    const wordSpan = (
      <span key={w} className="inline-block whitespace-nowrap">
        {chars}
      </span>
    );

    /* The separator is a plain U+0020 and it sits BETWEEN the word spans,
       never inside one. Both halves of that matter:
       - Inside an inline-block, a trailing space is collapsed away and the
         words render jammed together. That is why this was once a
         non-breaking space.
       - But NBSP is invisible in the markup and silently breaks find-in-page
         and copy-paste on every heading.
       Out here in normal flow a real space renders, wraps and copies. */
    return w < words.length - 1 ? [wordSpan, " "] : [wordSpan];
  });

  return createElement(
    as,
    {
      className: `${mode === "scroll" ? "m-chars-scroll" : "m-chars-intro"} ${className}`,
      "aria-label": text,
    },
    <span aria-hidden>{children}</span>,
  );
}
