"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { Key } from "@/data/i18n";
import { useApp } from "@/lib/lang";
import { Icon, Photo, SampleTag } from "@/components/ui";
import { galleryById } from "@/components/cake/gallery";
import { CAKES, encodeShare, isIdleCake, summaryLine, type CakeState } from "@/components/cake/cakeData";

/** The preview is always a photo: empty plate, then Marcia's cake they started from, or the plain cake for "From scratch". */
export function CakePhoto({ s }: { s: CakeState }) {
  const insp = galleryById(s.start);
  if (insp) return <Photo id={insp.id} alt="" className="h-full w-full" />;
  if (isIdleCake(s)) return <Photo id="cake-idle" alt="" className="h-full w-full" imgClassName="object-[50%_75%]" />;
  return <Photo id="cake-scratch" alt="" className="h-full w-full" />;
}

/**
 * Arrow-key movement for a WAI-ARIA radio group: one Tab stop per group, arrows move and select.
 * Works on any [role=radio] buttons inside the nearest [role=radiogroup].
 */
export function radioKeys(e: React.KeyboardEvent<HTMLElement>) {
  const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  const edge = e.key === "Home" ? "first" : e.key === "End" ? "last" : null;
  if (!dir && !edge) return;
  const group = e.currentTarget.closest('[role="radiogroup"]');
  if (!group) return;
  const radios = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
  const i = radios.indexOf(e.currentTarget);
  const nextEl = edge === "first" ? radios[0] : edge === "last" ? radios[radios.length - 1] : radios[(i + dir! + radios.length) % radios.length];
  e.preventDefault();
  nextEl.focus();
  nextEl.click();
}

/** Small pill radio group (lettering, placement, budget). `allowClear` lets a second tap unset it. */
export function Pills({
  label,
  value,
  options,
  onChange,
  allowClear = false,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (v: string) => void;
  allowClear?: boolean;
}) {
  const hasValue = options.some((o) => o.id === value);
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o, i) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (!hasValue && i === 0) ? 0 : -1}
            onClick={() => onChange(on && allowClear ? "" : o.id)}
            onKeyDown={radioKeys}
            className={`inline-flex min-h-[44px] items-center rounded-full border-2 px-4 text-[15px] font-bold tabular-nums transition-colors ${
              on ? "border-cocoa bg-cocoa text-cream" : "border-cream-line bg-white hover:border-cocoa/60"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Collapsible on phones; always open with a plain heading from 768px up. */
export function Section({ title, summary, defaultOpen = false, children }: { title: string; summary?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const heading = "text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft";
  return (
    <section className="border-b border-cream-line pb-2 md:border-0 md:pb-0">
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)} className="flex min-h-[52px] w-full items-center justify-between gap-3 text-left md:hidden">
          <span className="min-w-0">
            <span className={`block ${heading}`}>{title}</span>
            {!open && summary && <span className="block truncate text-[14px] font-semibold text-cocoa">{summary}</span>}
          </span>
          <Icon name="chevR" className={`h-5 w-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? "-rotate-90" : "rotate-90"}`} />
        </button>
        <span className={`hidden md:mb-3 md:block ${heading}`}>{title}</span>
      </h3>
      <div id={id} className={`${open ? "pb-4" : "hidden"} md:block md:pb-0`}>
        {children}
      </div>
    </section>
  );
}

/** Inspiration photos. Preview only: files stay on the device and are not part of share links. */
export function PhotoPicker({
  photos,
  setPhotos,
  max,
  error,
  setError,
}: {
  photos: string[];
  setPhotos: (p: string[]) => void;
  max: number;
  error?: string;
  setError: (e: string | undefined) => void;
}) {
  const { t } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const noteId = useId();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    if (!files.length) return;
    if (files.some((f) => !f.type.startsWith("image/") || f.size > 10 * 1024 * 1024)) {
      setError(t("cake.err.photo"));
      return;
    }
    setError(undefined);
    if (max === 1) photos.forEach((u) => URL.revokeObjectURL(u));
    const added = files.slice(0, max === 1 ? 1 : Math.max(0, max - photos.length)).map((f) => URL.createObjectURL(f));
    setPhotos(max === 1 ? added : [...photos, ...added]);
  };
  const remove = (u: string) => {
    URL.revokeObjectURL(u);
    setPhotos(photos.filter((x) => x !== u));
  };
  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" multiple={max > 1} onChange={onFile} className="sr-only" aria-label={t("cake.s4.photoBtn")} aria-describedby={noteId} />
      {photos.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-3">
          {photos.map((u) => (
            <li key={u} className="relative">
              <img src={u} alt={t("cake.s4.photoAlt")} className="h-28 w-28 rounded-2xl object-cover" />
              <button
                type="button"
                onClick={() => remove(u)}
                aria-label={t("cake.s4.photoRemove")}
                className="absolute -right-2 -top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cocoa text-cream ring-2 ring-cream"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {(photos.length < max || max === 1) && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-cocoa/30 bg-white px-4 py-5 text-[16px] font-bold hover:border-cocoa"
        >
          <Icon name="upload" className="h-6 w-6 text-brand" />
          {photos.length ? t(max === 1 ? "cake.s4.photoChange" : "cake.q.addPhoto") : t("cake.s4.photoBtn")}
        </button>
      )}
      <p id={noteId} className="mt-2 text-[13px] text-cocoa-soft">
        {t("cake.s4.photoNote")}
      </p>
      {error && <p className="err">{error}</p>}
    </div>
  );
}

/** Review upsell: one optional box of brigadeiros. Tapping the chosen box removes it. */
export function DocinhosCard({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { t } = useApp();
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border-2 border-cream-line bg-white">
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <Photo id="brigadeiro" alt="" className="h-20 w-20 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <h2 className="font-display text-[22px] font-semibold leading-tight">{t("cake.doc.title")}</h2>
          <p className="mt-1 text-[15px] text-cocoa-soft">{t("cake.doc.body")}</p>
        </div>
      </div>
      <div role="group" aria-label={t("cake.doc.title")} className="grid grid-cols-3 gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
        {CAKES.docinhos.boxes.map((b) => {
          const on = value === b.id;
          return (
            <button
              key={b.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? "" : b.id)}
              className={`flex min-h-[92px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-1 py-2 text-center transition-colors ${
                on ? "border-cocoa bg-cocoa text-cream" : "border-cream-line bg-white hover:border-cocoa/60"
              }`}
            >
              <span className="text-[14px] font-bold leading-tight">{t("cake.doc.box", { n: b.qty })}</span>
              <span className="font-display text-[20px] font-semibold leading-none tabular-nums">${b.price}</span>
              <SampleTag className="!px-1.5 !py-0 !text-[10px]" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Native share sheet where there is one, otherwise copy the link (or show it if copying is blocked). */
export function ShareButton({ s, className = "" }: { s: CakeState; className?: string }) {
  const { t } = useApp();
  const [status, setStatus] = useState<"" | "copied" | "manual">("");
  const [link, setLink] = useState("");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#cake=${encodeShare(s)}`;
    setLink(url);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: t("cake.share.title"), text: t("cake.share.text"), url });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return; // they closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setStatus(""), 3000);
    } catch {
      setStatus("manual");
    }
  };

  return (
    <div className={className}>
      <button type="button" onClick={share} className="btn-ghost w-full px-4">
        <Icon name={status === "copied" ? "check" : "arrow"} className="h-4 w-4" />
        {status === "copied" ? t("cake.share.copied") : t("cake.share.btn")}
      </button>
      <p role="status" className="mt-1.5 text-center text-[13px] text-cocoa-soft">
        {t("cake.share.note")}
      </p>
      {status === "manual" && (
        <label className="mt-2 block text-[13px] font-bold">
          {t("cake.share.copyFail")}
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="field mt-1 text-[14px]" />
        </label>
      )}
    </div>
  );
}

/** "Inspired by Marcia's Chocolate drip", from the gallery cake's style name. */
export function useInspiredLabel(s: CakeState) {
  const { t } = useApp();
  const g = galleryById(s.start);
  return g ? t("cake.inspiredBy", { name: t(`cake.style.${g.style}` as Key) }) : "";
}

/**
 * Desktop summary: CSS caps it at the screen height once stuck, but before that it starts lower down
 * (below the stepper). Trim it to the space actually left so the pinned price is on screen at every scroll.
 */
export function useFitPanel(ref: React.RefObject<HTMLElement | null>, remountKey: unknown) {
  useEffect(() => {
    let frame = 0;
    const fit = () => {
      frame = 0;
      const el = ref.current;
      if (!el || !el.getClientRects().length) return;
      const top = Math.max(84, el.getBoundingClientRect().top);
      el.style.maxHeight = `${Math.max(220, Math.min(window.innerHeight - 100, window.innerHeight - top - 16))}px`;
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(fit);
    };
    fit();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, [ref, remountKey]);
}

const COLLAPSE_AT = 120;

/**
 * Phones, Inside and Outside steps: the cake rides along at the top. 220px, shrinking to 96px after
 * 120px of scroll. The element's space in the page never changes, so collapsing can't move the content
 * (which would feed back into the scroll position and flicker). Tap opens the full summary.
 */
export function MobilePreview({
  s,
  price,
  onOpen,
  openRef,
}: {
  s: CakeState;
  price: string;
  onOpen: () => void;
  openRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const { t } = useApp();
  const [small, setSmall] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const inspired = useInspiredLabel(s);

  useEffect(() => {
    const onScroll = () => setSmall(window.scrollY > COLLAPSE_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // a quick pop whenever a choice changes the cake
  const look = JSON.stringify([s.size, s.flavor, s.filling, s.style, s.colorIds, s.addons, s.message, s.lettering, s.placement]);
  const lastLook = useRef(look);
  useEffect(() => {
    if (lastLook.current === look) return;
    lastLook.current = look;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    popRef.current?.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }], { duration: 260, easing: "ease-out" });
  }, [look]);

  return (
    <div data-cake-preview={small ? "small" : "large"} className="sticky top-[68px] z-30 -mx-4 mb-[156px] mt-3 h-[96px] sm:-mx-6 md:hidden">
      <div className="absolute inset-x-0 top-0 bg-cream px-4 pb-2 pt-1 sm:px-6">
        <div
          data-cake-preview-card
          className={`relative flex items-stretch overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_#E6D5BE,0_10px_20px_-14px_rgba(62,35,24,0.45)] transition-[height] duration-200 ease-out motion-reduce:transition-none ${
            small ? "h-[96px]" : "h-[220px]"
          }`}
        >
          <button ref={openRef} type="button" aria-haspopup="dialog" aria-label={`${t("cake.view")}: ${t("cake.summary")}`} onClick={onOpen} className="absolute inset-0 z-10" />
          <div
            className={`relative shrink-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_35%,#FFFDF8_0%,#F6EBDC_70%)] transition-[width] duration-200 ease-out motion-reduce:transition-none ${
              small ? "w-[96px]" : "w-[56%]"
            }`}
          >
            <div ref={popRef} className="h-full w-full">
              <CakePhoto s={s} />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center p-3">
            <p className="font-display text-[18px] font-semibold leading-tight">{t("cake.summary")}</p>
            {inspired && !small && <p className="mt-1 text-[13px] font-bold leading-snug text-brand-deep">{inspired}</p>}
            <p className={`mt-0.5 text-[13px] leading-snug text-cocoa-soft ${small ? "truncate" : "line-clamp-4"}`}>{summaryLine(s, t) || t("cake.nothingYet")}</p>
            <p className="mt-1 flex items-baseline justify-between gap-2">
              <span className="truncate font-display text-[18px] font-semibold tabular-nums">{price}</span>
              <span className="shrink-0 text-[13px] font-extrabold text-brand-deep">{t("cake.view")}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
