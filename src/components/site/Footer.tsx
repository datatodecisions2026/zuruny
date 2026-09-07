import { Quatrefoil } from "./Quatrefoil";
import { shipsTo } from "@/data/site";

export function Footer() {
  return (
    <footer
      id="shipping"
      className="relative border-t border-bronze/20 bg-paper-deep px-6 pb-16 pt-20 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <Quatrefoil
              className="h-14 w-14 text-bronze"
              title="Zuruny"
            />
            <p className="u-display mt-6 text-2xl text-char">Zuruny</p>
            <p className="u-measure mt-4 text-char/70">
              Pressed, poured and packed in Lebanon. Sent to whichever kitchen
              you ended up in.
            </p>
            <a
              href="mailto:hello@zuruny.co"
              className="mt-6 inline-block text-sm tracking-[0.14em] text-bronze underline decoration-bronze/40 underline-offset-8 transition-colors hover:text-char"
            >
              hello@zuruny.co
            </a>
          </div>

          <div>
            <h2 className="u-display text-lg text-char">
              We ship to {shipsTo.length} countries
            </h2>
            <div className="u-rule my-5" />
            <ul className="u-spec flex flex-wrap gap-x-5 gap-y-2 text-char-soft">
              {shipsTo.map((country) => (
                <li key={country}>{country}</li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-char-soft">
              Prices in USD. Orders leave Beirut.
            </p>
          </div>
        </div>

        <div className="u-rule mt-16" />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-char-soft">
          <p>© {new Date().getFullYear()} Zuruny, Beirut</p>
          <p lang="ar" dir="rtl" className="text-base text-bronze/70">
            زوروني
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
