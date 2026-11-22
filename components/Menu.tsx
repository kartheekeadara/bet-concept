"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import site from "@/data/site.json";
import { categories, type MenuCategory, type MenuItem as Item } from "@/lib/menu";
import type { Key } from "@/data/i18n";
import { useApp } from "@/lib/lang";
import { asset } from "@/lib/asset";
import { nowInBakeryTz, openStatus } from "@/lib/hours";
import { useScrollSpy } from "@/lib/useScrollSpy";
import { Icon, PriceTag } from "@/components/ui";

/*
 * "Balcão" menu: the whole menu in one scroll, every dish with its photo.
 * Phones: sticky chip bar that follows the scroll; rows with the photo on the right; tap opens a bottom sheet.
 * Tablet: two-column cards, photo on the left.
 * Desktop: sticky category rail on the left (with the pickup CTA), two-column cards; click opens a centered dialog.
 */

/** Portuguese weekday names are lowercase mid-sentence ("voltam terça"). */
export const dayInSentence = (name: string, lang: string) => (lang === "pt" ? name.toLowerCase() : name);
const LUNCH_DAYS = [2, 3, 4, 5]; // Tue–Fri
const secId = (c: MenuCategory) => `menu-${c.id}`;
const SEC_IDS = categories.map(secId);
const SPY_OFFSET = { base: 132, lg: 92 };

function Price({ item }: { item: Item }) {
  const { t } = useApp();
  if (item.price == null) return <span className="text-[14px] font-semibold leading-tight text-cocoa-soft">{t("menu.ask")}</span>;
  return <PriceTag amount={item.price} unit={item.unitKey ? t(item.unitKey as Key) : undefined} />;
}

function Popular() {
  const { t } = useApp();
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-[5px] bg-cocoa px-1.5 py-[3px] align-[2px] text-[11px] font-extrabold uppercase leading-none tracking-wide text-cream">
      <Icon name="star" className="h-3 w-3" />
      {t("menu.popular")}
    </span>
  );
}

function Extra({ item }: { item: Item }) {
  const { t, lang } = useApp();
  if (!item.monthly) return null;
  return (
    <span className="mt-1.5 block text-[14px] font-bold text-brand-deep">
      {t("today.feijoada", { date: site.feijoada.nextDate[lang] })}
    </span>
  );
}

/** Live line for lunch plates: served today, or the next day they're back. */
function LunchStatus() {
  const { t, lang } = useApp();
  const [msg, setMsg] = useState<{ on: boolean; text: string } | null>(null);
  useEffect(() => {
    const { day } = nowInBakeryTz();
    const s = openStatus();
    if (LUNCH_DAYS.includes(day) && s.kind !== "closed") return setMsg({ on: true, text: t("menu.lunch.today") });
    const next = [1, 2, 3, 4, 5, 6, 7].map((i) => (day + i) % 7).find((d) => LUNCH_DAYS.includes(d))!;
    setMsg({ on: false, text: t("menu.lunch.next", { day: dayInSentence(t(`day.${next}` as Key), lang) }) });
  }, [t, lang]);
  if (!msg) return null;
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 text-[14px] font-extrabold">
      <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${msg.on ? "bg-open" : "bg-cocoa-soft/50"}`} />
      {msg.text}
    </p>
  );
}

function Dish({
  item,
  wide,
  eager,
  onOpen,
}: {
  item: Item;
  wide: boolean;
  eager: boolean;
  onOpen: (item: Item, trigger: HTMLElement) => void;
}) {
  const { photos } = useApp();
  const src = photos.menu[item.id];

  return (
    <li className={wide ? "sm:col-span-2" : ""}>
      <button
        type="button"
        onClick={(e) => onOpen(item, e.currentTarget)}
        className="group flex h-full w-full gap-4 py-4 text-left transition-colors sm:rounded-2xl sm:border sm:border-cream-line sm:bg-white sm:p-3 sm:hover:border-cocoa/20 sm:hover:bg-cream/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {src && (
          <span
            className={`relative order-last shrink-0 overflow-hidden rounded-2xl bg-cream sm:order-first ${
              wide ? "h-24 w-24 sm:aspect-[4/3] sm:h-auto sm:w-2/5 sm:self-stretch" : "h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32"
            }`}
          >
            <img
              src={asset(src)}
              alt=""
              loading={eager ? "eager" : "lazy"}
              width={256}
              height={256}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </span>
        )}
        <span className={`flex min-w-0 flex-1 flex-col ${wide ? "sm:justify-center sm:py-2 sm:pr-3" : ""}`}>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span lang="pt-BR" className={`font-extrabold leading-snug ${wide ? "text-[17px] sm:font-display sm:text-[30px] sm:font-semibold sm:leading-tight" : "text-[17px]"}`}>
              {item.pt}
            </span>
            {item.popular && <Popular />}
          </span>
          <span lang="en" className={`mt-1 block text-[15px] leading-snug text-cocoa-soft ${wide ? "line-clamp-2 sm:line-clamp-none sm:text-[16px]" : "line-clamp-2"}`}>
            {item.en}
          </span>
          <Extra item={item} />
          <span className="mt-auto block pt-2.5">
            <Price item={item} />
          </span>
        </span>
      </button>
    </li>
  );
}

function noteIcon(id: string) {
  return id === "pratos" ? "clock" : "check";
}

function Section({
  cat,
  first,
  onOpen,
}: {
  cat: MenuCategory;
  first: boolean;
  onOpen: (item: Item, trigger: HTMLElement) => void;
}) {
  const { t } = useApp();
  return (
    <section id={secId(cat)} aria-labelledby={`${secId(cat)}-title`} className={`menu-sec ${first ? "pt-6 lg:pt-0" : "pt-12 sm:pt-14"}`}>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3">
        <h3 id={`${secId(cat)}-title`} lang="pt-BR" className="font-display text-[36px] font-semibold leading-none sm:text-[44px]">
          {cat.pt}
        </h3>
        {cat.id === "pratos" && <LunchStatus />}
      </div>
      {cat.noteKey && (
        <p className="mt-4 flex max-w-xl items-start gap-2.5 rounded-xl bg-cream px-3.5 py-2.5 text-[15px] font-bold leading-snug text-cocoa">
          <Icon name={noteIcon(cat.id)} className="mt-0.5 h-4 w-4 shrink-0 text-brand-deep" />
          {t(cat.noteKey as Key)}
        </p>
      )}
      <ul className="mt-4 divide-y divide-cream-line sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:divide-y-0">
        {cat.items.map((it) => (
          <Dish key={it.id} item={it} wide={!!it.monthly || cat.items.length === 1} eager={first} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  );
}

/** Same dish dialog at every size: bottom sheet on phones/tablets, centered card on desktop. */
function DishDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const { t, photos } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);
  const startY = useRef<number | null>(null);
  const src = photos.menu[item.id];
  const cat = categories.find((c) => c.items.some((i) => i.id === item.id));

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // only one focusable control inside: keep focus on it
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end bg-cocoa-deep/60 lg:items-center lg:justify-center lg:p-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
        className="relative animate-sheet max-h-[92svh] w-full overflow-y-auto rounded-t-3xl bg-cream px-4 pb-[max(env(safe-area-inset-bottom),20px)] pt-3 sm:mx-auto sm:max-w-[560px] lg:grid lg:max-w-[880px] lg:animate-fade lg:grid-cols-2 lg:gap-8 lg:rounded-3xl lg:p-6"
        onTouchStart={(e) => (startY.current = e.touches[0].clientY)}
        onTouchEnd={(e) => {
          if (startY.current !== null && e.changedTouches[0].clientY - startY.current > 80) onClose();
          startY.current = null;
        }}
      >
        <span aria-hidden className="mx-auto block h-1.5 w-12 rounded-full bg-cocoa/20 lg:hidden" />
        <div className="relative mt-3 lg:mt-0">
          {src && <img src={asset(src)} alt={`${item.pt}: ${item.en}`} className="aspect-square w-full rounded-2xl object-cover lg:aspect-[4/5]" />}
        </div>
        {/* one close control: over the photo on phones, top-right of the card on desktop */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t("a11y.close")}
          className="absolute right-7 top-[42px] inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream/95 text-cocoa hover:bg-cream-deep lg:right-5 lg:top-5 lg:bg-white"
        >
          <Icon name="close" className="h-6 w-6" />
        </button>
        <div className="mt-4 lg:mt-0 lg:flex lg:flex-col lg:pt-14">
          {cat && (
            <p lang="pt-BR" className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft lg:mt-auto">
              {cat.pt}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h4 id="dish-title" lang="pt-BR" className="font-display text-[30px] font-semibold leading-tight lg:text-[40px]">
              {item.pt}
            </h4>
            {item.popular && <Popular />}
          </div>
          <p lang="en" className="mt-1 text-[16px] leading-snug text-cocoa-soft lg:text-[18px]">
            {item.en}
          </p>
          <Extra item={item} />
          {cat?.noteKey && <p className="mt-3 text-[14px] font-bold text-cocoa">{t(cat.noteKey as Key)}</p>}
          <div className="mt-4 lg:mb-auto">
            <Price item={item} />
          </div>
        </div>
      </div>
    </div>
  );
}

function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export function Menu() {
  const { t } = useApp();
  const active = useScrollSpy(SEC_IDS, SPY_OFFSET);
  const [dish, setDish] = useState<Item | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // keep the active chip visible inside the horizontal bar (scroll the bar only, never the page)
  useEffect(() => {
    const bar = barRef.current;
    const chip = bar?.querySelector<HTMLElement>(`[data-sec="${active}"]`);
    if (!bar || !chip) return;
    const left = chip.offsetLeft - 16;
    const right = chip.offsetLeft + chip.offsetWidth + 16 - bar.clientWidth;
    if (bar.scrollLeft > left) bar.scrollTo({ left, behavior: "smooth" });
    else if (bar.scrollLeft < right) bar.scrollTo({ left: right, behavior: "smooth" });
  }, [active]);

  const open = useCallback((item: Item, el: HTMLElement) => {
    trigger.current = el;
    setDish(item);
  }, []);
  const close = useCallback(() => {
    setDish(null);
    trigger.current?.focus();
  }, []);

  const link = (c: MenuCategory) => ({
    href: `#${secId(c)}`,
    "aria-current": active === secId(c) ? ("true" as const) : undefined,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      jumpTo(secId(c));
    },
  });

  return (
    <section id="menu" aria-labelledby="menu-title" className="bg-white">
      <div className="mx-auto max-w-page px-4 pt-16 sm:px-6 sm:pt-24">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="menu-title" className="h2">
              {t("menu.title")}
            </h2>
            <p className="mt-3 max-w-lg text-[17px] text-cocoa-soft">{t("menu.intro")}</p>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end lg:hidden">
            <a href={site.uberEatsUrl} target="_blank" rel="noopener" className="btn-primary">
              {t("menu.orderPickup")} <Icon name="arrow" className="h-4 w-4" />
            </a>
            <span className="text-[13px] text-cocoa-soft">{t("menu.pickupNote")}</span>
          </div>
        </div>
      </div>

      {/* phones + tablets: sticky chips under the 68px header, following the scroll */}
      <nav aria-label={t("menu.cat.label")} className="sticky top-[68px] z-30 mt-8 border-y border-cream-line bg-white/95 backdrop-blur lg:hidden">
        <div ref={barRef} className="no-scrollbar mx-auto flex max-w-page gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
          {categories.map((c) => {
            const on = active === secId(c);
            return (
              <a
                key={c.id}
                {...link(c)}
                data-sec={secId(c)}
                lang="pt-BR"
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-extrabold transition-colors ${
                  on ? "bg-cocoa text-cream" : "bg-cream text-cocoa hover:bg-cream-deep"
                }`}
              >
                {c.pt}
                <span className={`text-[12px] font-bold tabular-nums ${on ? "text-cream/70" : "text-cocoa-soft"}`}>{c.items.length}</span>
              </a>
            );
          })}
        </div>
      </nav>

      <div className="mx-auto max-w-page px-4 pb-16 sm:px-6 sm:pb-24 lg:mt-12 lg:grid lg:grid-cols-[200px_1fr] lg:gap-12">
        {/* desktop: sticky rail with the pickup CTA always in reach */}
        <aside className="hidden lg:block">
          <div className="sticky top-[100px]">
            <nav aria-label={t("menu.cat.label")}>
              <ul className="space-y-1">
                {categories.map((c) => {
                  const on = active === secId(c);
                  return (
                    <li key={c.id}>
                      <a
                        {...link(c)}
                        lang="pt-BR"
                        className={`relative flex items-center justify-between rounded-xl py-2 pl-4 pr-3 font-display text-[22px] font-semibold leading-tight transition-colors ${
                          on ? "bg-cream text-cocoa" : "text-cocoa-soft hover:bg-cream/60 hover:text-cocoa"
                        }`}
                      >
                        <span aria-hidden className={`absolute inset-y-2 left-0 w-1 rounded-full transition-colors ${on ? "bg-brand" : "bg-transparent"}`} />
                        {c.pt}
                        <span className="font-sans text-[13px] font-bold tabular-nums text-cocoa-soft">{c.items.length}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="mt-8 border-t border-cream-line pt-6">
              <a href={site.uberEatsUrl} target="_blank" rel="noopener" className="btn-primary w-full justify-center">
                {t("menu.orderPickup")} <Icon name="arrow" className="h-4 w-4" />
              </a>
              <p className="mt-2 text-center text-[13px] text-cocoa-soft">{t("menu.pickupNote")}</p>
            </div>
          </div>
        </aside>

        <div>
          {categories.map((c, i) => (
            <Section key={c.id} cat={c} first={i === 0} onOpen={open} />
          ))}
        </div>
      </div>

      {dish && <DishDialog item={dish} onClose={close} />}
    </section>
  );
}
