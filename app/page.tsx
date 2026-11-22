import { Header, MobileBar } from "@/components/Header";
import { Hero, MustTry, Story, FeijoadaAndLoyalty, Visit, Footer } from "@/components/sections";
import { Menu } from "@/components/Menu";
import { Cakes } from "@/components/Cakes";
import { Catering } from "@/components/Catering";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <MustTry />
        <Menu />
        <Cakes />
        <Catering />
        <Story />
        <FeijoadaAndLoyalty />
        <Visit />
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
