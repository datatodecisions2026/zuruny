import { Hero } from "@/components/Hero";
import { Ledger } from "@/components/Ledger";
import { NameMarquee } from "@/components/NameMarquee";
import { RollCall } from "@/components/RollCall";
import { Film } from "@/components/Film";
import { Objects } from "@/components/Objects";
import { Reach } from "@/components/Reach";

/**
 * Seven sections, each about one screen. The order is deliberate:
 * the pour sells, the figures ground it, the names carry it, the film
 * breathes, the objects convert, the reach closes.
 *
 * Header, footer and cart drawer live in the root layout so every route
 * carries them.
 */
export default function HomePage() {
  return (
    <main id="main">
      <Hero />
      <Ledger />
      <NameMarquee />
      <RollCall />
      <Film />
      <Objects />
      <Reach />
    </main>
  );
}
