"use client";
import site from "@/data/site.json";
import { useApp } from "@/lib/lang";

export function CakeFooter() {
  const { t } = useApp();
  return (
    <footer className="bg-cocoa-deep pb-28 text-cream lg:pb-0">
      <p className="mx-auto max-w-page px-4 py-6 text-[14px] text-cream/80 sm:px-6">
        © {new Date().getFullYear()} {site.name} · <a href={`tel:${site.phone.tel}`} className="underline">{site.phone.display}</a> ·{" "}
        <span lang="en">{t("footer.disclaimer")}</span>
      </p>
    </footer>
  );
}
