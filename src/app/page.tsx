import Atmosphere from "@/components/site/Atmosphere";
import Menu from "@/components/site/Menu";
import TopBar from "@/components/site/TopBar";
import Hero from "@/components/site/Hero";
import Names from "@/components/site/Names";
import Film from "@/components/site/Film";
import Range from "@/components/site/Range";
import Objects from "@/components/site/Objects";
import Ribbon from "@/components/site/Ribbon";
import Footer from "@/components/site/Footer";

export default function Home() {
  return (
    <Atmosphere>
      <TopBar />
      <Menu />
      <main>
        <Hero />
        <Names />
        <Film />
        <Ribbon />
        <Range />
        <Objects />
      </main>
      <Footer />
    </Atmosphere>
  );
}
