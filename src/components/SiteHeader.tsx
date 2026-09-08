import Link from "next/link";
import { CartButton } from "@/components/CartButton";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/#names", label: "The names" },
  { href: "/#reach", label: "Shipping" },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      {/* The page's own read-progress. Driven by scroll(root), so it costs
          nothing and it is the one piece of chrome that is always moving. */}
      <div className="h-px w-full bg-[var(--rule)]">
        <div className="m-progress h-px w-full origin-left scale-x-0 bg-ochre" />
      </div>

      {/* Gradient only, no backdrop-blur: the filter applies across the whole
          box while the gradient fades, which leaves a hard seam straight
          across the hero photograph. */}
      <div className="bg-gradient-to-b from-ground via-ground/80 to-transparent pb-6">
        <nav
          aria-label="Primary"
          className="mx-auto flex items-center justify-between gap-6 px-[var(--gutter)] py-5"
        >
          <Link
            href="/"
            className="group flex items-center gap-3"
            aria-label="Zuruny — home"
          >
            <span
              aria-hidden
              className="u-emblem block size-7 text-cream transition-[color,transform] duration-700 ease-[var(--ease-out-soft)] group-hover:rotate-90 group-hover:text-ochre"
              style={{ ["--emblem-src" as string]: "url(/brand/emblem.png)" }}
            />
            <span className="u-mono text-cream">Zuruny</span>
          </Link>

          <div className="flex items-center gap-6">
            <ul className="hidden items-center gap-6 sm:flex">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="u-mono u-underline text-[var(--text-muted)] transition-colors duration-300 hover:text-cream"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <CartButton />
          </div>
        </nav>

        {/* Below `sm` the inline list is hidden, so the same links get a slim
            second row. A hamburger would hide the shop behind a tap on a site
            with three destinations. */}
        <ul className="flex items-center gap-5 px-[var(--gutter)] pb-1 sm:hidden">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="u-mono u-underline text-[var(--text-muted)] transition-colors duration-300 hover:text-cream"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
