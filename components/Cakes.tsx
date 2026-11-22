"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Key } from "@/data/i18n";
import { useApp } from "@/lib/lang";
import { Eyebrow, Icon, Photo } from "@/components/ui";

const GALLERY = Array.from({ length: 9 }, (_, i) => ({ id: `cake-${i + 1}`, key: `cakes.g${i + 1}` as Key }));

export function Cakes() {
  const { t } = useApp();
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
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Eyebrow dark>{t("cakes.eyebrow")}</Eyebrow>
            <h2 id="cakes-title" className="h2">
              {t("cakes.title")}
            </h2>
            <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-cream/90">{t("cakes.body")}</p>
          </div>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {GALLERY.map((g, i) => (
            <li key={g.id} className={i === 0 ? "col-span-2 md:col-span-1" : ""}>
              <button
                type="button"
                onClick={(e) => {
                  lastTrigger.current = e.currentTarget;
                  setOpen(i);
                }}
                aria-label={t("cakes.open", { label: t(g.key) })}
                className="group block h-full w-full overflow-hidden rounded-2xl text-left"
              >
                <Photo
                  id={g.id}
                  alt=""
                  className={`w-full rounded-2xl text-[12px] ${i === 0 ? "aspect-[4/3] md:aspect-square" : "aspect-square"}`}
                  imgClassName="transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Link href="/order-cake" className="btn min-h-[60px] bg-pink-light px-8 text-[19px] text-cocoa hover:bg-white">
            {t("cakes.design")}
          </Link>
          <p className="flex items-center gap-2 text-[16px] font-semibold text-cream/90">
            <Icon name="clock" className="h-5 w-5 text-pink-light" /> {t("cakes.lead")}
          </p>
        </div>
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
            <button type="button" onClick={() => step(1)} aria-label={t("a11y.next")} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cream/10 text-cream hover:bg-cream/20">
              <Icon name="chevR" className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
