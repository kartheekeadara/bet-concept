"use client";
import { useApp } from "@/lib/lang";

export function SkipLink() {
  const { t } = useApp();
  return (
    <a
      href="#main"
      className="sr-only z-[100] rounded-full bg-cocoa px-5 py-3 text-[15px] font-bold text-cream focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
    >
      {t("a11y.skip")}
    </a>
  );
}
