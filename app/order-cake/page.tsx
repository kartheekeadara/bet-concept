import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { CakeBuilder } from "@/components/cake/CakeBuilder";
import { CakeFooter } from "@/components/cake/CakeFooter";

export const metadata: Metadata = {
  title: "Design your cake · Brazilian Eats & Treats",
  description: "Build a custom celebration cake: size, flavor, filling, design and pickup date. $25 deposit holds your date.",
};

export default function OrderCakePage() {
  return (
    <>
      <Header />
      <main id="main">
        <CakeBuilder />
      </main>
      <CakeFooter />
    </>
  );
}
