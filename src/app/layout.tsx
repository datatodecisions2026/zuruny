import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartDrawer } from "@/components/CartDrawer";
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
  metadataBase: new URL("https://zuruny.co"),
  title: {
    default: "Zuruny — Lebanese olive oil, molasses and ceramics",
    template: "%s · Zuruny",
  },
  description:
    "Single-origin olive oil from named villages in Lebanon, each tin carrying the name of someone in the founder's family. Molasses, ceramic carafes and Lebanese cedar. Shipped from Beirut to 29 countries.",
  openGraph: {
    title: "Zuruny",
    description:
      "Every oil carries a name. Single-origin Lebanese olive oil, molasses and ceramics, shipped from Beirut.",
    url: "https://zuruny.co",
    siteName: "Zuruny",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0908",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:bg-ochre focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-ground"
        >
          Skip to content
        </a>
        <CartProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
