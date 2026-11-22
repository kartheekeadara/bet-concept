"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import site from "@/data/site.json";
import { categories, type MenuCategory, type MenuItem as Item } from "@/lib/menu";
import type { Key } from "@/data/i18n";
import { useApp } from "@/lib/lang";
import { asset } from "@/lib/asset";
import { nowInBakeryTz, openStatus } from "@/lib/hours";
import { Eyebrow, Icon, PriceTag } from "@/components/ui";

/*
 * "Vitrine" menu: one category at a time (tabs switch, they don't scroll the page).
 * Desktop: typographic list + a sticky display-case pane that shows the hovered/focused dish.
 * Phones: rows keep one left edge; dishes with a photo get a thumbnail on the right that opens a bottom sheet.
 */

const TAB_KEY = "bet-menu-tab";
/** Portuguese weekday names are lowercase mid-sentence ("voltam terça"). */
export const dayInSentence = (name: string, lang: string) => (lang === "pt" ? name.toLowerCase() : name);
const LUNCH_DAYS = [2, 3, 4, 5]; // Tue–Fri

function Price({ item }: { item: Item }) {
  const { t } = useApp();
  if (item.price == null) return <span className="text-[14px] font-semibold leading-tight text-cocoa-soft">{t("menu.ask")}</span>;
  return <PriceTag amount={item.price} unit={item.unitKey ? t(item.unitKey as Key) : undefined} />;
}

function Extra({ item }: { item: Item }) {
  const { t, lang } = useApp();
  if (!item.monthly) return null;
  return (
    <span className="mt-1.5 block text-[14px] font-bold text-pink-deep">
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
    <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 text-[14px] font-extrabold">
      <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${msg.on ? "bg-open" : "bg-cocoa-soft/50"}`} />
      {msg.text}
    </p>
  );
}

function Row({
  item,
  active,
  onPreview,
  onOpen,
}: {
  item: Item;
  active: boolean;
  onPreview: (id: string) => void;
  onOpen: (item: Item, trigger: HTMLElement) => void;
}) {
  const { photos } = useApp();
  const thumb = photos.menu[item.id];

  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span lang="pt-BR" className="block text-[18px] font-extrabold leading-snug">
          {item.pt}
        </span>
        <span lang="en" className="mt-1 block text-[15px] leading-snug text-cocoa-soft">
          {item.en}
        </span>
        <Extra item={item} />
        {/* phones: price sits under the description so the right edge belongs to the photo */}
        <span className="mt-2.5 block lg:hidden">
          <Price item={item} />
        </span>
      </span>
      <span className="hidden shrink-0 pt-0.5 lg:block">
        <Price item={item} />
      </span>
      {thumb && (
        <span className="relative shrink-0 lg:hidden">
          <img src={asset(thumb)} alt="" loading="lazy" width={84} height={84} className="h-[84px] w-[84px] rounded-2xl object-cover" />
          <span aria-hidden className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-cocoa text-cream ring-2 ring-white">
            <Icon name="expand" className="h-3.5 w-3.5" />
          </span>
        </span>
      )}
    </>
  );

  const rowCls = `relative flex w-full gap-4 py-4 text-left transition-colors lg:-mx-4 lg:w-[calc(100%+2rem)] lg:rounded-2xl lg:px-4 ${
    active ? "lg:bg-cream" : "lg:hover:bg-cream/60"
  }`;

  return (
    <li className="border-b border-cream-line last:border-b-0 lg:border-b-0" onMouseEnter={() => onPreview(item.id)}>
      {thumb ? (
        // Only dishes with a photo are interactive: desktop previews, phones open the sheet.
        <button
          type="button"
          className={rowCls}
          onFocus={() => onPreview(item.id)}
          onClick={(e) => {
            onPreview(item.id);
            if (!window.matchMedia("(min-width: 1024px)").matches) onOpen(item, e.currentTarget);
          }}
        >
          {body}
        </button>
      ) : (
        <div className={rowCls}>{body}</div>
      )}
    </li>
  );
}

/** Desktop display case: the dish's photo, or a type card when there's no photo yet. */
function Preview({ item, category }: { item: Item | undefined; category: MenuCategory }) {
  const { photos } = useApp();
  const src = item ? photos.menu[item.id] : undefined;
  const vitrine = photos.slots.counter?.src;
  return (
    <div key={src ?? category.id} className="animate-fade">
      {src ? (
        <img src={asset(src)} alt="" className="aspect-[4/5] w-full rounded-3xl object-cover" />
      ) : (
        // no dish photo yet: the real pastry case, with the category name over it
        <div className="relative isolate flex aspect-[4/5] w-full flex-col justify-end overflow-hidden rounded-3xl bg-cocoa p-8 text-cream">
          {vitrine && <img src={asset(vitrine)} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />}
          <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(44,24,15,0.92)_0%,rgba(44,24,15,0.55)_45%,rgba(44,24,15,0.1)_100%)]" />
          <span lang="pt-BR" className="font-display text-[56px] font-semibold leading-[0.95]">
            {category.pt}
          </span>
        </div>
      )}
      {item && (
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p lang="pt-BR" className="font-display text-[28px] font-semibold leading-tight">
              {item.pt}
            </p>
            <p lang="en" className="mt-1 text-[16px] leading-snug text-cocoa-soft">
              {item.en}
            </p>
          </div>
          <span className="shrink-0 pt-1">
            <Price item={item} />
          </span>
        </div>
      )}
    </div>
  );
}

/** Phone bottom sheet for a dish photo. Focus moves in, Esc / backdrop / swipe-down close, focus returns. */
function Sheet({ item, onClose }: { item: Item; onClose: () => void }) {
  const { t, photos } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);
  const startY = useRef<number | null>(null);
  const src = photos.menu[item.id];

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
    <div className="fixed inset-0 z-[60] flex items-end bg-cocoa-deep/60 lg:hidden" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="animate-sheet max-h-[92svh] w-full overflow-y-auto rounded-t-3xl bg-cream px-4 pb-[max(env(safe-area-inset-bottom),20px)] pt-3"
        onTouchStart={(e) => (startY.current = e.touches[0].clientY)}
        onTouchEnd={(e) => {
          if (startY.current !== null && e.changedTouches[0].clientY - startY.current > 80) onClose();
          startY.current = null;
        }}
      >
        <div className="flex items-center justify-between">
          <span aria-hidden className="mx-auto h-1.5 w-12 rounded-full bg-cocoa/20" />
        </div>
        <div className="relative mt-3">
          {src && <img src={asset(src)} alt={`${item.pt}: ${item.en}`} className="aspect-square w-full rounded-2xl object-cover" />}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("a11y.close")}
            className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream/95 text-cocoa"
          >
            <Icon name="close" className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h4 id="sheet-title" lang="pt-BR" className="font-display text-[28px] font-semibold leading-tight">
              {item.pt}
            </h4>
            <p lang="en" className="mt-1 text-[16px] leading-snug text-cocoa-soft">
              {item.en}
            </p>
            <Extra item={item} />
          </div>
          <span className="shrink-0 pt-1">
            <Price item={item} />
          </span>
        </div>
      </div>
    </div>
  );
}

export function Menu() {
  const { t, photos } = useApp();
  const [activeId, setActiveId] = useState(categories[0].id);
  const [previewId, setPreviewId] = useState<string | undefined>();
  const [sheet, setSheet] = useState<Item | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const cat = categories.find((c) => c.id === activeId) ?? categories[0];
  const firstWithPhoto = cat.items.find((i) => photos.menu[i.id])?.id;
  const preview = cat.items.find((i) => i.id === (previewId ?? firstWithPhoto)) ;

  // remember the last category (per-viewer convenience only)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TAB_KEY);
      if (saved && categories.some((c) => c.id === saved)) setActiveId(saved);
    } catch {
      /* storage blocked */
    }
  }, []);

  const select = useCallback((id: string, focus = false) => {
    setActiveId(id);
    setPreviewId(undefined);
    try {
      window.localStorage.setItem(TAB_KEY, id);
    } catch {
      /* ignore */
    }
    const tab = tabsRef.current?.querySelector<HTMLElement>(`[data-cat="${id}"]`);
    if (focus) tab?.focus();
    tab?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    // if the list has scrolled up under the sticky tabs, bring its start back into view
    const panel = panelRef.current;
    if (panel && panel.getBoundingClientRect().top < 0) {
      window.scrollTo({ top: window.scrollY + panel.getBoundingClientRect().top - 150, behavior: "smooth" });
    }
  }, []);

  const onTabKey = (e: React.KeyboardEvent) => {
    const i = categories.findIndex((c) => c.id === activeId);
    const go = (n: number) => {
      e.preventDefault();
      select(categories[(n + categories.length) % categories.length].id, true);
    };
    if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(categories.length - 1);
  };

  const closeSheet = useCallback(() => {
    setSheet(null);
    trigger.current?.focus();
  }, []);

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

      {/* sticky category tabs under the 68px header; switching shows one category at a time */}
      <div className="sticky top-[68px] z-30 mt-8 border-y border-cream-line bg-white/95 backdrop-blur">
        <div
          ref={tabsRef}
          role="tablist"
          aria-label={t("menu.cat.label")}
          onKeyDown={onTabKey}
          className="no-scrollbar mx-auto flex max-w-page gap-2 overflow-x-auto px-4 py-2.5 sm:px-6"
        >
          {categories.map((c) => {
            const on = c.id === activeId;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                id={`tab-${c.id}`}
                data-cat={c.id}
                lang="pt-BR"
                aria-selected={on}
                aria-controls="menu-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => select(c.id)}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-extrabold transition-colors ${
                  on ? "bg-cocoa text-cream" : "bg-cream text-cocoa hover:bg-cream-deep"
                }`}
              >
                {c.pt}
                <span className={`text-[12px] font-bold tabular-nums ${on ? "text-cream/70" : "text-cocoa-soft"}`}>{c.items.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={panelRef}
        id="menu-panel"
        role="tabpanel"
        aria-labelledby={`tab-${cat.id}`}
        className="mx-auto grid max-w-page gap-16 px-4 pb-16 pt-8 sm:px-6 sm:pb-24 lg:grid-cols-[1fr_minmax(360px,0.75fr)]"
      >
        <div>
          <h3 lang="pt-BR" className="font-display text-[40px] font-semibold leading-none sm:text-[52px]">
            {cat.pt}
          </h3>
          {cat.id === "pratos" && <LunchStatus />}
          {cat.noteKey && <p className="mt-3 max-w-lg text-[15px] font-semibold text-pink-deep">{t(cat.noteKey as Key)}</p>}
          <ul className="mt-6">
            {cat.items.map((it) => (
              <Row
                key={it.id}
                item={it}
                active={preview?.id === it.id}
                onPreview={setPreviewId}
                onOpen={(item, el) => {
                  trigger.current = el;
                  setSheet(item);
                }}
              />
            ))}
          </ul>
        </div>
        <aside aria-hidden className="hidden lg:block">
          <div className="sticky top-[160px]">
            <Preview item={preview} category={cat} />
          </div>
        </aside>
      </div>

      {sheet && <Sheet item={sheet} onClose={closeSheet} />}
    </section>
  );
}
