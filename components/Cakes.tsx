"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/lang";
import { Icon, Photo } from "@/components/ui";
import { GALLERY } from "@/components/cake/gallery";
import { EMPTY, summaryLine, type CakeState } from "@/components/cake/cakeData";

/** A cake started on /order-cake but not sent yet (sessionStorage, same key as the builder). */
function useDraft() {
  const [draft, setDraft] = useState<{ s: CakeState; reached: number } | null>(null);
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("bet-cake-v2");
      if (!raw) return;
      const d = JSON.parse(raw) as { s: CakeState; reached: number };
      const st = { ...EMPTY, ...d.s };
      if (d.reached > 1 || st.start) setDraft({ s: st, reached: Math.max(1, d.reached || 1) });
    } catch {
      /* storage blocked: no chip */
    }
  }, []);
  return draft;
}

export function Cakes() {
  const { t } = useApp();
  const draft = useDraft();
  const [open, setOpen] = useState<number | null>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(null);
    lastTrigger.current?.focus();
  }, []);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + GALLERY.length) % GALLERY.length)), []);

  useEffect(() => {
    if (open === null) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  // simple swipe for phones
  const touchX = useRef<number | null>(null);

  return (
    <section id="cakes" aria-labelledby="cakes-title" className="bg-cocoa text-cream">
      <div className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 id="cakes-title" className="h2 sm:text-[56px]">
              {t("cakes.title")}
            </h2>
            <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-cream/90">{t("cakes.body")}</p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <Link href="/order-cake" className="btn min-h-[60px] bg-rose-light px-8 text-[19px] text-cocoa hover:bg-white">
              {t("cakes.design")} <Icon name="arrow" className="h-5 w-5" />
            </Link>
            <p className="flex items-center gap-2 text-[15px] font-semibold text-cream/85">
              <Icon name="clock" className="h-5 w-5 text-rose-light" /> {t("cakes.lead")}
            </p>
            {draft && (
              // picks up where they left off in the builder (same tab session)
              <Link
                href={`/order-cake#step-${draft.reached}`}
                className="inline-flex max-w-full items-center gap-2 rounded-full bg-cream/10 py-2 pl-3 pr-4 text-[14px] font-bold text-cream ring-1 ring-cream/25 hover:bg-cream/20"
              >
                <Icon name="cake" className="h-4 w-4 shrink-0 text-rose-light" />
                <span className="truncate">
                  {t("cakes.resume")}
                  {summaryLine(draft.s, t) ? `: ${summaryLine(draft.s, t)}` : ""}
                </span>
                <Icon name="arrow" className="h-4 w-4 shrink-0" />
              </Link>
            )}
          </div>
        </div>

        {/* the wedding cake leads (2×2); everything else is a captioned tile */}
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {GALLERY.map((g, i) => (
            <li key={g.id} className={i === 0 ? "col-span-2 lg:row-span-2" : ""}>
              <button
                type="button"
                onClick={(e) => {
                  lastTrigger.current = e.currentTarget;
                  setOpen(i);
                }}
                aria-label={t("cakes.open", { label: t(g.key) })}
                className="group relative block h-full w-full overflow-hidden rounded-2xl text-left"
              >
                <Photo
                  id={g.id}
                  alt=""
                  className={`h-full w-full rounded-2xl text-[12px] ${i === 0 ? "aspect-[4/5] lg:aspect-auto" : "aspect-square"}`}
                  imgClassName={`transition-transform duration-500 group-hover:scale-[1.04] ${g.pos ?? ""}`}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-[linear-gradient(to_top,rgba(44,24,15,0.85),rgba(44,24,15,0))] px-3 pb-2.5 pt-10 text-[14px] font-bold leading-tight sm:text-[15px]"
                >
                  {i === 0 && <span className="mb-1 block text-[12px] font-extrabold uppercase tracking-[0.14em] text-rose-light">{t("cakes.leadTag")}</span>}
                  <span className={i === 0 ? "font-display text-[24px] sm:text-[30px]" : ""}>{t(g.key)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t(GALLERY[open].key)}
          className="fixed inset-0 z-[60] flex flex-col bg-cocoa-deep/95 p-4"
          onClick={(e) => e.target === e.currentTarget && close()}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-bold text-cream/90" aria-live="polite">
              {t(GALLERY[open].key)} · {open + 1}/{GALLERY.length}
            </p>
            <button ref={closeBtn} type="button" onClick={close} aria-label={t("a11y.close")} className="inline-flex h-12 w-12 items-center justify-center rounded-full text-cream hover:bg-cream/10">
              <Icon name="close" className="h-7 w-7" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center py-4" onClick={(e) => e.target === e.currentTarget && close()}>
            <Photo id={GALLERY[open].id} alt={t(GALLERY[open].key)} className="h-full max-h-[80vh] w-full max-w-4xl rounded-2xl" imgClassName="!object-contain bg-cocoa-deep" />
          </div>
          <div className="flex justify-center gap-4 pb-2">
            <button type="button" onClick={() => step(-1)} aria-label={t("a11y.prev")} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cream/10 text-cream hover:bg-cream/20">
              <Icon name="chevL" className="h-6 w-6" />
            </button>
            {/* point-and-order: opens the builder with this cake pre-picked as the starting point */}
            <Link href={`/order-cake?from=${GALLERY[open].id}`} className="btn min-h-12 bg-rose-light px-6 text-cocoa hover:bg-white">
              {t("cakes.orderLike")} <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => step(1)} aria-label={t("a11y.next")} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cream/10 text-cream hover:bg-cream/20">
              <Icon name="chevR" className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
