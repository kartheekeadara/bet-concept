import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutHeader } from "@/components/Header";
import { CakeBuilder } from "@/components/cake/CakeBuilder";
import { CakeFooter } from "@/components/cake/CakeFooter";

export const metadata: Metadata = {
  title: "Design your cake · Brazilian Eats & Treats",
  description: "Build a custom celebration cake: size, flavor, filling, design and pickup date. $25 deposit holds your date.",
};

export default function OrderCakePage() {
  return (
    <>
      <CheckoutHeader />
      <main id="main">
        {/* useSearchParams (?from=) needs a Suspense boundary in a static export */}
        <Suspense fallback={<div className="min-h-[70vh]" />}>
          <CakeBuilder />
        </Suspense>
      </main>
      <CakeFooter />
    </>
  );
}
