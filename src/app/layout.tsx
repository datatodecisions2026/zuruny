import type { Metadata } from "next";
import { Cinzel, EB_Garamond, Courier_Prime } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/shop/CartProvider";
import CartDrawer from "@/components/shop/CartDrawer";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const courier = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Zuruny — Come visit me",
  description:
    "Single-origin Lebanese olive oil, molasses and cedar, each one named after someone worth remembering. Pressed in Lebanon, shipped to 29 countries.",
  openGraph: {
    title: "Zuruny — Come visit me",
    description:
      "Single-origin Lebanese olive oil, molasses and cedar, each one named after someone worth remembering.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${garamond.variable} ${courier.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-char">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
