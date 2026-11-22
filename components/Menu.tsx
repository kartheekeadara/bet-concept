"use client";
import { useEffect, useRef, useState } from "react";
import site from "@/data/site.json";
import { categories, type MenuItem as Item } from "@/lib/menu";
import type { Key } from "@/data/i18n";
import { useApp } from "@/lib/lang";
import { asset } from "@/lib/asset";
import { Eyebrow, Icon, price } from "@/components/ui";

function Tag({ children, tone = "pink" }: { children: React.ReactNode; tone?: "pink" | "cocoa" }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${
        tone === "pink" ? "bg-pink text-white" : "bg-cocoa text-cream"
      }`}
    >
      {children}
    </span>
  );
}

function Row({ item }: { item: Item }) {
  const { t, photos } = useApp();
  const thumb = photos.menu[item.id];
  return (
    <li className="flex gap-4 border-b border-cream-line py-4 last:border-b-0">
      {thumb && <img src={asset(thumb)} alt={`${item.pt}: ${item.en}`} loading="lazy" width={56} height={56} className="h-14 w-14 shrink-0 rounded-xl object-cover" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h4 lang="pt-BR" className="text-[17px] font-extrabold">
            {item.pt}
          </h4>
          {item.popular && <Tag>{t("menu.tag.popular")}</Tag>}
          {item.weekday && <Tag tone="cocoa">{t("menu.tag.weekday")}</Tag>}
          {item.monthly && <Tag tone="cocoa">{t("menu.tag.monthly")}</Tag>}
        </div>
        <p lang="en" className="mt-1 text-[15px] leading-snug text-cocoa-soft">
          {item.en}
        </p>
      </div>
      <div className="shrink-0">
        <p className="pt-0.5 text-right text-[16px] font-extrabold tabular-nums">
          {item.price != null ? (
            <>
              {price(item.price)}
              {item.unitKey && <span className="block text-[12px] font-semibold text-cocoa-soft">/ {t(item.unitKey as Key)}</span>}
            </>
          ) : (
            <span className="block max-w-[6.5rem] text-[13px] font-semibold leading-tight text-cocoa-soft">{t("menu.ask")}</span>
          )}
        </p>
      </div>
    </li>
  );
}

export function Menu() {
  const { t } = useApp();
  const [active, setActive] = useState(categories[0].id);
  const tabsRef = useRef<HTMLDivElement>(null);

  // highlight the tab of the category in view
  useEffect(() => {
    const els = categories.map((c) => document.getElementById(`cat-${c.id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // keep the active tab visible inside the horizontal scroller
  useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    const bar = tabsRef.current;
    if (tab && bar) bar.scrollTo({ left: tab.offsetLeft - 16, behavior: "smooth" });
  }, [active]);

  return (
    <section id="menu" aria-labelledby="menu-title" className="bg-white">
      <div className="mx-auto max-w-page px-4 pt-16 sm:px-6 sm:pt-24">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>{t("menu.eyebrow")}</Eyebrow>
            <h2 id="menu-title" className="h2">
              {t("menu.title")}
            </h2>
            <p className="mt-3 max-w-lg text-[17px] text-cocoa-soft">{t("menu.intro")}</p>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <a href={site.uberEatsUrl} target="_blank" rel="noopener" className="btn-primary">
              {t("menu.orderPickup")} <Icon name="arrow" className="h-4 w-4" />
            </a>
            <span className="text-[13px] text-cocoa-soft">{t("menu.pickupNote")}</span>
          </div>
        </div>
      </div>

      {/* sticky category tabs (Panera-style), sits under the 68px header */}
      <div className="sticky top-[68px] z-30 mt-8 border-y border-cream-line bg-white/95 backdrop-blur">
        <div ref={tabsRef} className="no-scrollbar mx-auto flex max-w-page gap-2 overflow-x-auto px-4 py-2.5 sm:px-6" role="navigation" aria-label={t("menu.cat.label")}>
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#cat-${c.id}`}
              data-cat={c.id}
              lang="pt-BR"
              aria-current={active === c.id ? "true" : undefined}
              onClick={() => setActive(c.id)}
              className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full px-4 text-[15px] font-extrabold transition-colors ${
                active === c.id ? "bg-cocoa text-cream" : "bg-cream text-cocoa hover:bg-cream-deep"
              }`}
            >
              {c.pt}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-page gap-x-16 px-4 pb-16 pt-4 sm:px-6 sm:pb-24 lg:grid-cols-2">
        {categories.map((c) => (
          <div key={c.id} id={`cat-${c.id}`} className="scroll-mt-[140px] pt-8">
            <h3 lang="pt-BR" className="border-b-2 border-cocoa pb-2 font-display text-[30px] font-semibold">
              {c.pt}
            </h3>
            {c.noteKey && <p className="mt-3 text-[15px] font-semibold text-pink-deep">{t(c.noteKey as Key)}</p>}
            <ul>
              {c.items.map((it) => (
                <Row key={it.id} item={it} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
