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

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-cream/15 pt-8 pe-20">
          <p className="u-mono text-cream/50">
            &copy; {new Date().getFullYear()} Zuruny
          </p>
          {/* Stated plainly rather than discovered at a broken checkout. */}
          <p className="u-mono text-cream/50">
            {t.footer.payment}
          </p>
        </div>
      </div>

      {/* TODO: swap the placeholder for the real number (digits only, with country code). */}
      <a
        href="https://wa.me/96100000000"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="absolute bottom-6 end-[var(--gutter)] grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/30 transition-transform duration-300 hover:scale-110"
      >
        <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden>
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.39 9.39 0 0 1-1.44-5.01c0-5.19 4.23-9.42 9.43-9.42a9.36 9.36 0 0 1 6.66 2.76 9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.23 9.42-9.44 9.42zm8.02-17.44A11.27 11.27 0 0 0 12.05.75C5.8.75.72 5.83.72 12.08c0 2 .52 3.95 1.52 5.66L.62 23.62l6.02-1.58a11.3 11.3 0 0 0 5.4 1.38h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.31-8.03z" />
        </svg>
      </a>
    </footer>
  );
}
