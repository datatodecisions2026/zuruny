import { getDict, type Locale } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  return (
    <footer className="relative isolate overflow-hidden bg-oxblood">
      {/* The damask gets exactly one contained panel — this one. IMAGES.txt
          is clear that its repeat is not clean enough for page wallpaper. */}
      <div className="u-damask absolute inset-0 -z-10" aria-hidden />

      <div className="px-[var(--gutter)] py-[clamp(4rem,10vh,7rem)]">
        <div className="grid gap-12 lg:grid-cols-[1fr_auto]">
          <div>
            <span
              aria-hidden
              className="u-emblem block size-16 text-cream"
              style={{ ["--emblem-src" as string]: "url(/brand/logo-lockup.png)" }}
            />
            <p className="u-display u-measure mt-8 text-[length:var(--step-2)] text-cream">
              {t.footer.tagline}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <a
              href="mailto:hello@zuruny.co"
              className="u-mono text-cream underline-offset-8 transition-colors duration-300 hover:text-ochre hover:underline"
            >
              hello@zuruny.co
            </a>
            <p className="u-mono text-cream/55">{t.footer.location}</p>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-cream/15 pt-8">
          <p className="u-mono text-cream/50">
            &copy; {new Date().getFullYear()} Zuruny
          </p>
          {/* Stated plainly rather than discovered at a broken checkout. */}
          <p className="u-mono text-cream/50">
            {t.footer.payment}
          </p>
        </div>
      </div>
    </footer>
  );
}
