import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import { DEFAULT_LOCALE, isLocale, getDict } from "@/lib/i18n";
import "./globals.css";

/* The deck's tins use an inscriptional roman and a typewriter face. The last
   build translated that literally (Cinzel + EB Garamond + Courier Prime) and
   read as period costume. This keeps the *structure* of that pairing — a
   high-contrast serif for names, a mono for the spec strip — in faces drawn
   this decade. */
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zuruny.vercel.app"),
  title: {
    default: "Zuruny — Lebanese olive oil, molasses and ceramics",
    template: "%s · Zuruny",
  },
  description:
    "Single-origin olive oil from named villages in Lebanon, each tin carrying the name of someone in the founder's family. Molasses, ceramic carafes and Lebanese cedar. Shipped from Beirut to 29 countries.",
  icons: {
    icon: "/brand/emblem-mark.png",
    apple: "/brand/emblem-mark.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0908",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Set by the proxy; the root layout never receives route params.
  const headerLocale = (await headers()).get("x-zuruny-locale");
  const locale = isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  const t = getDict(locale);

  return (
    <html
      lang={locale}
      className={`${instrumentSerif.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:bg-ochre focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-ground"
        >
          {t.a11y.skip}
        </a>
        {children}
      </body>
    </html>
  );
}
