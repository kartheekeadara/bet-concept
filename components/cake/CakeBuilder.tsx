"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Key } from "@/data/i18n";
import site from "@/data/site.json";
import { useApp } from "@/lib/lang";
import { fmtTime } from "@/lib/hours";
import { Icon, Photo } from "@/components/ui";
import { GALLERY, galleryById } from "@/components/cake/gallery";
import {
  CAKES,
  DIETARY,
  BUDGETS,
  EMPTY,
  OCCASIONS,
  type CakeState,
  addDays,
  applyStart,
  decodeShare,
  docinhoBox,
  earliestDate,
  emailOk,
  estimate,
  fillingById,
  flavorById,
  fmtDate,
  isDateAllowed,
  isOpenDay,
  isQuote,
  leadDaysFor,
  normalizeDraft,
  phoneDigits,
  summaryLine,
  sizeById,
  sizeForGuests,
  slotsFor,
  todayYMD,
} from "@/components/cake/cakeData";
import { Calendar } from "@/components/cake/Calendar";
import { CakeArt, FILLING_COLORS } from "@/components/cake/CakeArt";
import { OccasionIcon } from "@/components/cake/OccasionIcon";
import { CakePhoto, DocinhosCard, MobilePreview, PhotoPicker, Pills, Section, ShareButton, radioKeys, useFitPanel, useInspiredLabel } from "@/components/cake/parts";

// Start · Size · Inside · Outside · Pickup (+ contact) · Review
const TOTAL = 6;
const prettyPhone = (p: string) => {
  const d = phoneDigits(p);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
};
// v2: 6-screen flow + start/guests fields (v1 drafts used 7 steps, so they are ignored)
const STORE_KEY = "bet-cake-v2";
type Errors = Partial<Record<keyof CakeState | "photo", string>>;

export function CakeBuilder() {
  const { t, lang } = useApp();
  // captured once: the restore effect runs on mount only, and we strip ?from= right after
  const fromRef = useRef(useSearchParams().get("from"));
  const [s, setS] = useState<CakeState>(EMPTY);
  const [step, setStep] = useState(1);
  const [reached, setReached] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [sharedNotice, setSharedNotice] = useState(false);
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timeShakeRef = useShake(errors.time);
  const firstRender = useRef(true);

  /* ── restore progress (sessionStorage) and the step from the URL hash ── */
  useEffect(() => {
    let restoredReached = 1;
    let base: CakeState = EMPTY;
    try {
      const raw = window.sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { s: Partial<CakeState>; reached: number };
        base = normalizeDraft(saved.s);
        restoredReached = Math.min(Math.max(1, saved.reached || 1), TOTAL);
        setReached(restoredReached);
      }
    } catch {
      /* storage blocked: start fresh */
    }
    // a shared design link (#cake=…) opens straight at Review; keep this visitor's own contact details
    const shared = decodeShare(window.location.hash);
    if (shared) {
      setS(withContact(shared, base));
      setReached(TOTAL);
      setStep(TOTAL);
      setSharedNotice(true);
      window.history.replaceState({ step: TOTAL }, "", `${window.location.pathname}#step-${TOTAL}`);
      setHydrated(true);
      return;
    }
    // "Order one like this" on the homepage gallery links here with ?from=<cake id>.
    // Read via useSearchParams: on a client-side navigation window.location may not be updated yet.
    const fromParam = fromRef.current;
    const fromCake = fromParam ? galleryById(fromParam) : undefined;
    if (fromCake) base = applyStart(base, fromCake.id);
    setS(base);
    const m = window.location.hash.match(/step-(\d)/);
    const fromHash = m ? Number(m[1]) : 1;
    const start = Math.min(fromHash, restoredReached);
    setStep(start);
    // drop ?from= so a refresh doesn't override later choices
    window.history.replaceState({ step: start }, "", `${window.location.pathname}#step-${start}`);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || orderNo) return;
    try {
      window.sessionStorage.setItem(STORE_KEY, JSON.stringify({ s, reached }));
    } catch {
      /* ignore */
    }
  }, [s, reached, hydrated, orderNo]);

  /* ── browser back/forward moves between steps ── */
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      // a share link pasted into a tab that already has the builder open
      const shared = decodeShare(window.location.hash);
      if (shared) {
        setOrderNo(null);
        setErrors({});
        setS((prev) => withContact(shared, prev));
        setReached(TOTAL);
        setStep(TOTAL);
        setSharedNotice(true);
        window.history.replaceState({ step: TOTAL }, "", `${window.location.pathname}#step-${TOTAL}`);
        return;
      }
      const n = (e.state && e.state.step) || Number(window.location.hash.match(/step-(\d)/)?.[1] ?? 1);
      setOrderNo(null);
      setErrors({});
      setStep(Math.min(Math.max(1, n), TOTAL));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* ── move focus to the new step's heading so screen readers and keyboards follow ── */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step, orderNo]);

  const update = <K extends keyof CakeState>(k: K, v: CakeState[K]) => {
    setS((prev) => {
      // starting from one of Marcia's cakes pre-fills its look (all still changeable on Outside)
      const next = k === "start" ? applyStart(prev, v as string) : { ...prev, [k]: v };
      // size change can push the chosen date inside the new lead time
      if (k === "size" && prev.date && !isDateAllowed(prev.date, v as string)) {
        next.date = "";
        next.time = "";
        setErrors((e) => ({ ...e, date: t("cake.err.dateLead") }));
      }
      if (k === "date") next.time = "";
      return next;
    });
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = useCallback(
    (n: number): Errors => {
      const e: Errors = {};
      if (n === 1 && !s.start) e.start = t("cake.err.start");
      if (n === 2 && !s.size) e.size = t("cake.err.size");
      if (n === 3) {
        if (!s.flavor) e.flavor = t("cake.err.flavor");
        if (!s.filling) e.filling = t("cake.err.filling");
      }
      if (n === 5) {
        if (!s.date || !isDateAllowed(s.date, s.size)) e.date = s.date ? t("cake.err.dateLead") : t("cake.err.date");
        else if (!isQuote(s) && !s.time) e.time = t("cake.err.time");
        if (isQuote(s) && !Number(s.guests)) e.guests = t("cake.err.guests");
        // contact lives on the pickup screen now
        if (!s.name.trim()) e.name = t("form.required");
        if (phoneDigits(s.phone).length !== 10) e.phone = t("form.phone");
        // optional: Marcia confirms by text; only check it if they typed something
        if (s.email.trim() && !emailOk(s.email)) e.email = t("form.email");
      }
      return e;
    },
    [s, t],
  );

  const goTo = (n: number) => {
    setErrors({});
    setStep(n);
    window.history.pushState({ step: n }, "", `#step-${n}`);
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) {
      setErrors(e);
      const first = Object.keys(e)[0];
      window.setTimeout(() => document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus(), 0);
      return;
    }
    if (step < TOTAL) {
      // Came here from Review's "Edit"? Go straight back to Review (submit re-checks every step).
      const target = reached >= TOTAL ? TOTAL : step + 1;
      setReached((r) => Math.max(r, step + 1));
      goTo(target);
    }
  };

  /** Guest count only recommends a size (tag on the card); the customer still picks it. */
  const setGuests = (v: string) => update("guests", v.replace(/\D/g, "").slice(0, 3));

  const back = () => {
    if (step > 1) window.history.back();
  };

  /** Sends the order (deposit is mocked for the concept) or, for tiered cakes, the quote request. */
  const submit = () => {
    // Re-check every step in case something was edited into an invalid state.
    for (let n = 1; n < TOTAL; n++) {
      const e = validate(n);
      if (Object.keys(e).length) {
        setErrors(e);
        goTo(n);
        return;
      }
    }
    // Live version: Stripe/Square checkout; money goes straight to the bakery.
    const no = `${isQuote(s) ? "QUO" : "BET"}-${String(Date.now()).slice(-5)}`;
    setOrderNo(no);
    window.history.pushState({ step: TOTAL, done: true }, "", "#confirmed");
    try {
      window.sessionStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
  };

  const restart = () => {
    setS(EMPTY);
    setReached(1);
    setOrderNo(null);
    setPhotos([]);
    setSharedNotice(false);
    setStep(1);
    window.history.replaceState({ step: 1 }, "", "#step-1");
  };

  const size = sizeById(s.size);
  const est = estimate(s);
  const quote = isQuote(s);
  const box = docinhoBox(s.docinhos);
  const estLabel = est === null ? "—" : est === "quote" ? (box ? t("cake.quotePlus", { n: box.price }) : t("cake.quote")) : `$${est.total}`;
  const stepLabels: Key[] = ["cake.s1", "cake.s2", "cake.s3", "cake.s4", quote ? "cake.q.step" : "cake.s5", quote ? "cake.q.review" : "cake.s7"];
  const recommended = sizeForGuests(Number(s.guests));
  const previewStep = step === 3 || step === 4;
  const [sheetOpen, setSheetOpen] = useState(false);
  const stripRef = useRef<HTMLButtonElement>(null);
  const previewRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useFitPanel(panelRef, orderNo);

  if (orderNo) {
    // what happens next: confirmation by tomorrow, baking the day before, pickup
    // next day the bakery is open (closed Mondays), so we never promise a reply on a closed day
    let confirmBy = addDays(todayYMD(), 1);
    while (!isOpenDay(confirmBy)) confirmBy = addDays(confirmBy, 1);
    const shortDate = (d: string) => fmtDate(d, lang, { weekday: "short", month: "short", day: "numeric" });
    const replyBy = t("cake.track.by", { date: shortDate(confirmBy), time: fmtTime("18:00", lang) });
    const steps: { key: Key; when: string; done?: boolean }[] = quote
      ? [
          { key: "cake.track.requested", when: t("cake.track.now"), done: true },
          { key: "cake.q.trackQuote", when: replyBy },
          ...(s.date ? [{ key: "cake.q.trackEvent" as Key, when: shortDate(s.date) }] : []),
        ]
      : [
          { key: "cake.track.requested", when: t("cake.track.now"), done: true },
          { key: "cake.track.confirm", when: replyBy },
          ...(s.date ? [{ key: "cake.track.baking" as Key, when: shortDate(addDays(s.date, -1)) }] : []),
          ...(s.date ? [{ key: "cake.track.ready" as Key, when: `${shortDate(s.date)}${s.time ? ` · ${fmtTime(s.time, lang)}` : ""}` }] : []),
        ];
    const smsHref = `sms:${site.phone.sms}?&body=${encodeURIComponent(t("cake.done.smsBody", { no: orderNo }))}`;
    return (
      <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12">
          <div>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white">
              <Icon name="check" className="h-8 w-8" />
            </span>
            <h1 ref={headingRef} tabIndex={-1} className="mt-5 font-display text-[44px] font-semibold leading-[1.02] outline-none sm:text-[56px]">
              {t(quote ? "cake.q.doneTitle" : "cake.done.title")}
            </h1>
            <p className="mt-3 max-w-md text-[18px] leading-relaxed">{t(quote ? "cake.q.doneBody" : "cake.done.body")}</p>
            <p className="mt-4 text-[15px] text-cocoa-soft">
              {t(quote ? "cake.q.number" : "cake.done.order")} <strong className="font-display text-[22px] font-semibold tabular-nums text-cocoa">{orderNo}</strong>
            </p>

            {/* progress tracker (sweetgreen / Faire pattern) */}
            <h2 className="mt-10 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.done.track")}</h2>
            <ol className="mt-4">
              {steps.map((st, i) => (
                <li key={st.key} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < steps.length - 1 && <span aria-hidden className={`absolute left-[15px] top-8 h-[calc(100%-24px)] w-0.5 ${st.done ? "bg-cocoa" : "bg-cream-line"}`} />}
                  <span
                    aria-hidden
                    className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${
                      st.done ? "bg-cocoa text-cream" : "border-2 border-cream-line bg-white text-cocoa-soft"
                    }`}
                  >
                    {st.done ? <Icon name="check" className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className="pt-0.5">
                    <span className="block text-[17px] font-extrabold leading-tight">{t(st.key)}</span>
                    <span className="block text-[15px] text-cocoa-soft">{st.when}</span>
                  </span>
                  {st.done && <span className="sr-only">✓</span>}
                </li>
              ))}
            </ol>

            {/* the useful next actions */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {s.date && !quote && (
                <button type="button" onClick={() => downloadIcs(s, orderNo, t)} className="btn-primary px-4">
                  <Icon name="clock" /> {t("cake.done.calendar")}
                </button>
              )}
              <a href={site.address.directionsUrl} target="_blank" rel="noopener" className="btn-ghost px-4">
                <Icon name="pin" /> {t("visit.directions")}
              </a>
              <a href={smsHref} className="btn-ghost px-4">
                <Icon name="phone" /> {t("cake.done.text")}
              </a>
            </div>
            <ShareButton s={s} className="mt-3" />
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 text-[16px] font-bold underline decoration-brand decoration-2 underline-offset-4">
                {t("cake.done.home")}
              </Link>
              <button type="button" onClick={restart} className="inline-flex min-h-[44px] items-center gap-2 text-[16px] font-bold underline decoration-cream-line decoration-2 underline-offset-4">
                {t("cake.done.new")}
              </button>
            </div>
          </div>

          {/* the cake they ordered, with the summary and estimate */}
          <div className="rounded-3xl bg-white p-5 shadow-[0_1px_0_#E6D5BE,0_20px_40px_-24px_rgba(62,35,24,0.35)]">
            <CakeStage s={s} />
            <p className="mt-4 font-display text-[24px] font-semibold">{t("cake.summary")}</p>
            <MiniSummary s={s} />
            <div className="mt-5 border-t border-cream-line pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[15px] font-bold">{t("cake.estimate")}</span>
                <span className="font-display text-[26px] font-semibold tabular-nums">{estLabel}</span>
              </div>
              <PriceLines s={s} compact />
              {!quote && <p className="mt-2 text-[13px] text-cocoa-soft">{t("cake.done.depositPaid", { amount: CAKES.deposit })}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-page px-4 pb-36 pt-6 sm:px-6 lg:pb-24 lg:pt-10">
      {/* Top row: back + title */}
      <div className="flex items-center gap-2">
        {step > 1 ? (
          <button type="button" onClick={back} className="-ml-2 inline-flex min-h-[44px] items-center gap-2 rounded-full px-2 text-[16px] font-bold hover:bg-cream-deep">
            <Icon name="back" /> {t("cake.back")}
          </button>
        ) : (
          <Link href="/" className="-ml-2 inline-flex min-h-[44px] items-center gap-2 rounded-full px-2 text-[16px] font-bold hover:bg-cream-deep">
            <Icon name="back" /> {t("cake.backHome")}
          </Link>
        )}
      </div>

      {/* Desktop stepper */}
      <ol className="mt-6 hidden items-center gap-2 lg:flex" aria-label={t("cake.pageTitle")}>
        {stepLabels.map((k, i) => {
          const n = i + 1;
          const isCur = n === step;
          const can = n <= reached && !isCur;
          return (
            <li key={k} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!can}
                onClick={() => can && goTo(n)}
                aria-current={isCur ? "step" : undefined}
                className={`flex min-h-[44px] items-center gap-2 rounded-full pr-3 text-[15px] font-bold ${can ? "hover:bg-cream-deep" : ""} ${
                  isCur ? "text-cocoa" : n < reached || n < step ? "text-cocoa" : "text-cocoa-soft"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] ${
                    isCur ? "bg-brand text-white" : n < step || n < reached ? "bg-cocoa text-cream" : "border-2 border-cream-line bg-white"
                  }`}
                >
                  {n < step || (n < reached && !isCur) ? <Icon name="check" className="h-4 w-4" /> : n}
                </span>
                {t(k)}
              </button>
              {n < TOTAL && <span aria-hidden className={`h-0.5 flex-1 rounded ${n < step ? "bg-cocoa" : "bg-cream-line"}`} />}
            </li>
          );
        })}
      </ol>

      {/* Mobile progress */}
      <div className="mt-4 lg:hidden">
        <p className="text-[14px] font-bold text-cocoa-soft">
          {t("cake.step", { n: step, total: TOTAL })} · {t(stepLabels[step - 1])}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-line" aria-hidden>
          <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>
        {/* phones: the cake rides along as a strip; tap for the full view + summary */}
        <button
          ref={stripRef}
          type="button"
          aria-haspopup="dialog"
          onClick={() => setSheetOpen(true)}
          className={`mt-4 w-full items-center gap-3 rounded-2xl bg-white p-2 pr-4 text-left shadow-[0_1px_0_#E6D5BE] ${previewStep ? "hidden md:flex" : "flex"}`}
        >
          <span className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-cream">
            <CakePhoto s={s} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[18px] font-semibold leading-tight">{t("cake.summary")}</span>
            <span className="block truncate text-[14px] text-cocoa-soft">{summaryLine(s, t) || t("cake.nothingYet")}</span>
          </span>
          <span className="shrink-0 text-[14px] font-extrabold text-brand-deep">{t("cake.view")}</span>
        </button>
      </div>

      {previewStep && hydrated && <MobilePreview s={s} price={estLabel} onOpen={() => setSheetOpen(true)} openRef={previewRef} />}

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12">
        <div className={hydrated ? "" : "invisible"}>
          {step === 1 && (
            <Step title={t("cake.s1.title")} headingRef={headingRef}>
              {/* occasion: optional quick chips (sets context for Marcia, not required) */}
              <h2 id="occ-label" className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">
                {t("cake.s1.occasion")} <span className="font-semibold normal-case tracking-normal">· {t("cake.optional")}</span>
              </h2>
              <div role="radiogroup" aria-labelledby="occ-label" className="flex flex-wrap gap-2">
                {OCCASIONS.map((o) => {
                  const on = s.occasion === o.id;
                  const tabbable = s.occasion ? on : o.id === OCCASIONS[0].id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      tabIndex={tabbable ? 0 : -1}
                      onClick={() => update("occasion", o.id)}
                      onKeyDown={radioKeys}
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 pl-3 pr-4 text-[15px] font-bold transition-colors ${
                        on ? "border-cocoa bg-cocoa text-cream" : "border-cream-line bg-white hover:border-cocoa/60"
                      }`}
                    >
                      <OccasionIcon id={o.id} className="h-5 w-5" />
                      {t(o.key)}
                    </button>
                  );
                })}
              </div>

              {/* two doors: point at one of Marcia's cakes, or build from scratch */}
              <h2 className="mb-1 mt-10 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.s1.start")}</h2>
              <p className="mb-4 text-[15px] text-cocoa-soft">{t("cake.s1.startHint")}</p>
              <Choice
                name="start"
                label={t("cake.s1.start")}
                value={s.start}
                onChange={(v) => update("start", v)}
                error={errors.start}
                cols="grid-cols-2 sm:grid-cols-3"
                optionClass="p-0 text-left"
                options={[
                  {
                    id: "scratch",
                    content: (
                      <span className="flex h-full flex-col">
                        <Photo id="cake-scratch" alt="" className="aspect-square w-full rounded-t-[14px]" />
                        <span className="block px-3 py-2.5">
                          <span className="block text-[15px] font-extrabold leading-tight">{t("cake.s1.scratch")}</span>
                          <span className="block text-[13px] text-cocoa-soft">{t("cake.s1.scratchHint")}</span>
                        </span>
                      </span>
                    ),
                  },
                  ...GALLERY.map((g) => ({
                    id: g.id,
                    content: (
                      <span className="flex h-full flex-col">
                        <Photo id={g.id} alt="" className="aspect-square w-full rounded-t-[14px]" />
                        <span className="block px-3 py-2.5 text-[14px] font-bold leading-snug">{t(g.key)}</span>
                      </span>
                    ),
                  })),
                ]}
              />
            </Step>
          )}

          {step === 2 && (
            <Step title={t("cake.s2.title")} hint={t("cake.s2.hint")} headingRef={headingRef}>
              <GuestField value={s.guests} onChange={setGuests} className="mb-6" />
              <Choice
                name="size"
                label={t("cake.s2.title")}
                value={s.size}
                onChange={(v) => update("size", v)}
                error={errors.size}
                cols="grid-cols-2 sm:grid-cols-4"
                options={CAKES.sizes.map((z) => ({
                  id: z.id,
                  highlight: z.id === recommended,
                  content: (
                    <>
                      {z.id === recommended && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-deep px-2.5 py-0.5 text-[12px] font-extrabold text-white">
                          {t("cake.recommended")}
                        </span>
                      )}
                      <CakeArt s={s} sizeOverride={z.id} minimal className="mx-auto -mt-2 mb-1 h-20 w-28" />
                      <span className="block font-display text-[34px] font-semibold leading-none">{z.id === "tiered" ? t("cake.tiered") : z.label}</span>
                      <span className="mt-2 block text-[16px] font-extrabold">{t("cake.serves", { n: z.serves })}</span>
                      <span className="mt-1 block text-[14px] font-semibold text-cocoa-soft">
                        {z.from != null ? t("cake.from", { price: z.from }) : t("cake.quote")}
                      </span>
                      {z.tiers > 1 && (
                        <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-brand-deep">
                          <Icon name="clock" className="h-3.5 w-3.5" /> 14 {lang === "pt" ? "dias" : "days"}
                        </span>
                      )}
                    </>
                  ),
                }))}
              />
            </Step>
          )}

          {step === 3 && (
            <Step title={t("cake.s3.title")} headingRef={headingRef}>
              {/* one tap picks both: the combinations Marcia sells most */}
              <h3 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.s3.pairings")}</h3>
              <div className="mb-8 flex flex-wrap gap-2">
                {CAKES.pairings.map(([fl, fi]) => {
                  const on = s.flavor === fl && s.filling === fi;
                  return (
                    <button
                      key={fl + fi}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        update("flavor", fl);
                        update("filling", fi);
                      }}
                      className={`inline-flex min-h-[48px] items-center gap-3 rounded-full border-2 py-1.5 pl-1.5 pr-4 text-left text-[15px] font-bold transition-colors ${
                        on ? "border-cocoa bg-cocoa text-cream" : "border-cream-line bg-white hover:border-cocoa/60"
                      }`}
                    >
                      <span className="flex -space-x-3">
                        <Swatch color={flavorById(fl)!.color} kind="cake" size="sm" />
                        <Swatch color={FILLING_COLORS[fi]} kind="filling" size="sm" />
                      </span>
                      <span lang="pt-BR">
                        {flavorById(fl)!.pt} + {fillingById(fi)!.pt}
                      </span>
                    </button>
                  );
                })}
              </div>
              <h3 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.s3.flavor")}</h3>
              <Choice
                name="flavor"
                label={t("cake.s3.flavor")}
                value={s.flavor}
                onChange={(v) => update("flavor", v)}
                error={errors.flavor}
                cols="grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-2"
                options={CAKES.flavors.map((f) => ({
                  id: f.id,
                  content: (
                    <OptionBody
                      swatch={<Swatch color={f.color} kind="cake" />}
                      pt={f.pt}
                      en={f.en}
                      loved={CAKES.mostLoved.flavor === f.id}
                      premium={f.premium}
                    />
                  ),
                }))}
              />
              <h3 className="mb-3 mt-8 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.s3.filling")}</h3>
              <Choice
                name="filling"
                label={t("cake.s3.filling")}
                value={s.filling}
                onChange={(v) => update("filling", v)}
                error={errors.filling}
                cols="grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-2"
                options={CAKES.fillings.map((f) => ({
                  id: f.id,
                  content: (
                    <OptionBody
                      swatch={<Swatch color={FILLING_COLORS[f.id]} kind="filling" />}
                      pt={f.pt}
                      en={f.en}
                      loved={CAKES.mostLoved.filling === f.id}
                      premium={f.premium}
                    />
                  ),
                }))}
              />
            </Step>
          )}

          {step === 4 && (
            <Step title={t("cake.s4.title")} hint={t("cake.s4.hint")} headingRef={headingRef}>
              <DesignStep s={s} update={update} photos={photos} setPhotos={setPhotos} errors={errors} setErrors={setErrors} />
            </Step>
          )}

          {step === 5 && (
            <Step title={t(quote ? "cake.q.title" : "cake.s5.title")} hint={quote ? t("cake.q.hint") : undefined} headingRef={headingRef}>
              {quote && <h2 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.q.date")}</h2>}
              <p className="mb-4 flex items-start gap-2.5 rounded-xl bg-cream-deep px-4 py-3 text-[15px] font-semibold">
                <Icon name="clock" className="mt-0.5 h-5 w-5 shrink-0 text-cocoa-soft" />
                {size
                  ? t("cake.s5.lead", {
                      size: size.id === "tiered" ? t("cake.tiered").toLowerCase() : size.label,
                      days: leadDaysFor(size.id),
                      date: fmtDate(earliestDate(size.id), lang),
                    })
                  : t("cake.s5.leadNoSize")}
              </p>
              <Calendar
                value={s.date}
                onChange={(d) => update("date", d)}
                isAllowed={(d) => isDateAllowed(d, s.size)}
                initialMonth={s.date || earliestDate(s.size)}
                minMonth={todayYMD()}
                maxMonth={addDays(todayYMD(), 365)}
                error={errors.date}
              />
              <p className="mt-2 text-[13px] text-cocoa-soft">
                {t("cake.s5.closedMon")} ·{" "}
                {t("cake.cal.holidays", {
                  dates: CAKES.closedDates.filter((d) => d >= todayYMD()).map((d) => fmtDate(d, lang, { month: "short", day: "numeric" })).join(", "),
                })}
              </p>
              <p className="mt-1 text-[13px] text-cocoa-soft">{t("cake.cal.limitedNote")}</p>

              {quote && (
                <div className="mt-8 space-y-8">
                  <GuestField value={s.guests} onChange={setGuests} error={errors.guests} />
                  <div>
                    <h2 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">
                      {t("cake.q.budget")} <span className="font-semibold normal-case tracking-normal">· {t("cake.optional")}</span>
                    </h2>
                    <Pills
                      label={t("cake.q.budget")}
                      value={s.budget}
                      allowClear
                      onChange={(v) => update("budget", v)}
                      options={BUDGETS.map((b) => ({ id: b, label: t(`cake.q.b.${b}` as Key) }))}
                    />
                  </div>
                  <div>
                    <h2 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.q.photos")}</h2>
                    <PhotoPicker photos={photos} setPhotos={setPhotos} max={4} error={errors.photo} setError={(m) => setErrors((x) => ({ ...x, photo: m }))} />
                  </div>
                </div>
              )}

              {!quote && <fieldset className="mt-8">
                <legend className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.s5.time")}</legend>
                {s.date ? (
                  <>
                    <p className="mb-3 text-[16px] font-bold">{fmtDate(s.date, lang)}</p>
                    {/* one radio group (arrow keys run across all slots), visually split into parts of the day */}
                    <div
                      role="radiogroup"
                      aria-label={t("cake.s5.time")}
                      aria-describedby={errors.time ? "err-time" : undefined}
                      ref={timeShakeRef}
                      className="space-y-4"
                    >
                      {(() => {
                        const slots = slotsFor(s.date);
                        const hasSel = slots.includes(s.time);
                        const parts: [Key, string[]][] = [
                          ["cake.s5.morning", slots.filter((x) => Number(x.slice(0, 2)) < 12)],
                          ["cake.s5.midday", slots.filter((x) => Number(x.slice(0, 2)) >= 12 && Number(x.slice(0, 2)) < 15)],
                          ["cake.s5.afternoon", slots.filter((x) => Number(x.slice(0, 2)) >= 15)],
                        ];
                        return parts
                          .filter(([, list]) => list.length)
                          .map(([label, list]) => (
                            <div key={label}>
                              <p aria-hidden className="mb-2 text-[13px] font-bold text-cocoa-soft">
                                {t(label)}
                              </p>
                              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                {list.map((slot) => {
                                  const on = s.time === slot;
                                  const tabbable = hasSel ? on : slot === slots[0];
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      role="radio"
                                      aria-checked={on}
                                      tabIndex={tabbable ? 0 : -1}
                                      data-field={tabbable ? "time" : undefined}
                                      onClick={() => update("time", slot)}
                                      onKeyDown={radioKeys}
                                      className={`min-h-[48px] rounded-xl border-2 text-[15px] font-bold tabular-nums ${
                                        on ? "border-cocoa bg-cocoa text-cream" : "border-cream-line bg-white hover:border-cocoa"
                                      }`}
                                    >
                                      {fmtTime(slot, lang)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                      })()}
                    </div>
                    {errors.time && (
                      <p id="err-time" className="err">
                        {errors.time}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[15px] text-cocoa-soft">{t("cake.s5.pickDate")}</p>
                )}
              </fieldset>}

              <h2 className="mb-4 mt-12 border-t border-cream-line pt-8 font-display text-[28px] font-semibold leading-tight">{t("cake.s6.title")}</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField id="name" label={t("cake.s6.name")} value={s.name} onChange={(v) => update("name", v)} error={errors.name} autoComplete="name" />
                <TextField
                  id="phone"
                  label={t("cake.s6.phone")}
                  hint={t("cake.s6.phoneHint")}
                  value={s.phone}
                  onChange={(v) => update("phone", v)}
                  error={errors.phone}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(704) 555-0123"
                />
                <TextField
                  id="email"
                  label={t("cake.s6.emailOptional")}
                  value={s.email}
                  onChange={(v) => update("email", v)}
                  error={errors.email}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="sm:col-span-2"
                />
                <div className="sm:col-span-2">
                  <label htmlFor="f-notes" className="label">
                    {t("cake.s6.notes")}
                  </label>
                  <textarea id="f-notes" rows={3} value={s.notes} onChange={(e) => update("notes", e.target.value)} className="field" />
                </div>
              </div>
            </Step>
          )}

          {step === TOTAL && (
            <Step title={t(quote ? "cake.q.reviewTitle" : "cake.s7.title")} headingRef={headingRef}>
              {sharedNotice && <p role="status" className="mb-4 rounded-xl bg-rose-wash px-4 py-3 text-[15px] font-semibold">{t("cake.share.restored")}</p>}
              <Summary s={s} photos={photos} onEdit={goTo} />
              <DocinhosCard value={s.docinhos} onChange={(v) => update("docinhos", v)} />
              <div className="mt-6 rounded-2xl border-2 border-cream-line bg-white p-4 sm:p-5">
                <h2 className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-cocoa-soft">{t("cake.breakdown")}</h2>
                <PriceLines s={s} />
              </div>
              {/* neutral, reassuring: this is the trust moment, not a warning */}
              <div className="mt-6 flex gap-4 rounded-2xl bg-cream-deep p-5">
                <span aria-hidden className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cocoa text-cream">
                  <Icon name="check" className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-[22px] font-semibold leading-tight">{quote ? t("cake.q.noDeposit") : t("cake.s7.deposit", { amount: CAKES.deposit })}</p>
                  <ul className="mt-2 space-y-1 text-[15px] text-cocoa-soft">
                    {quote ? (
                      <li>{t("cake.q.noDepositNote")}</li>
                    ) : (
                      <>
                        <li>{t("cake.s7.depositNote")}</li>
                        <li>{t("cake.s7.refund")}</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
              <ShareButton s={s} className="mt-6" />
              <button type="button" onClick={submit} className="btn-primary mt-4 hidden w-full min-h-[56px] text-[18px] lg:flex">
                {quote ? t("cake.q.send") : t("cake.s7.pay", { amount: CAKES.deposit })}
              </button>
              {!quote && <p className="mt-3 text-center text-[13px] text-cocoa-soft">{t("cake.s7.mock")}</p>}
            </Step>
          )}

          {/* Desktop nav buttons */}
          {step < TOTAL && (
            <div className="mt-10 hidden items-center justify-between gap-4 lg:flex">
              {step > 1 ? (
                <button type="button" onClick={back} className="btn-ghost">
                  <Icon name="back" /> {t("cake.back")}
                </button>
              ) : (
                <span />
              )}
              <button type="button" onClick={next} className="btn-primary min-w-[200px]">
                {t("cake.continue")} <Icon name="arrow" className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Desktop stage: the live cake on the left, sticky while the options scroll on the right */}
        <aside
          ref={panelRef}
          data-summary-panel
          className="sticky top-[84px] hidden max-h-[calc(100vh-100px)] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1px_0_#E6D5BE,0_20px_40px_-24px_rgba(62,35,24,0.35)] lg:order-first lg:flex"
          aria-label={t("cake.summary")}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5" data-summary-scroll tabIndex={0} aria-label={t("cake.summary")}>
            {/* the drawing gives up height first on short screens */}
            <CakeStage s={s} heightClass="h-[clamp(120px,32vh,380px)]" />
            <div className="mt-4 flex items-baseline justify-between gap-4">
              <p className="font-display text-[24px] font-semibold">{t("cake.summary")}</p>
              {s.occasion && <p className="text-[15px] text-cocoa-soft">{t(OCCASIONS.find((o) => o.id === s.occasion)!.key)}</p>}
            </div>
            <MiniSummary s={s} />
            <div className="pb-4">
              <PriceLines s={s} compact />
            </div>
          </div>
          {/* pinned: the price and deposit are always on screen */}
          <div data-summary-price className="shrink-0 border-t border-cream-line bg-white px-5 pb-4 pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold">{t("cake.estimate")}</span>
              <span className="font-display text-[26px] font-semibold tabular-nums" aria-live="polite">
                {estLabel}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-cocoa-soft">{quote ? t("cake.q.noDeposit") : t("cake.s7.deposit", { amount: CAKES.deposit })}</p>
          </div>
        </aside>
      </div>

      {sheetOpen && (
        <CakeSheet
          onClose={() => {
            setSheetOpen(false);
            (previewRef.current?.offsetParent ? previewRef : stripRef).current?.focus();
          }}
        >
          <CakeStage s={s} />
          <MiniSummary s={s} />
          <div className="mt-5 border-t border-cream-line pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold">{t("cake.estimate")}</span>
              <span className="font-display text-[26px] font-semibold tabular-nums">{estLabel}</span>
            </div>
            <PriceLines s={s} compact />
          </div>
        </CakeSheet>
      )}

      {/* Mobile sticky bottom bar: estimate + Continue */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-line bg-cream/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold uppercase tracking-wider text-cocoa-soft">{t("cake.estimate")}</p>
            <p className="truncate font-display text-[20px] font-semibold leading-tight tabular-nums">{estLabel}</p>
          </div>
          {step < TOTAL ? (
            <button type="button" onClick={next} className="btn-primary min-w-[150px]">
              {t("cake.continue")}
            </button>
          ) : (
            <button type="button" onClick={submit} className="btn-primary">
              {quote ? t("cake.q.send") : t("cake.s7.pay", { amount: CAKES.deposit })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────── building blocks ───────────── */

function Step({ title, hint, children, headingRef }: { title: string; hint?: string; children: React.ReactNode; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <section>
      <h1 ref={headingRef} tabIndex={-1} className="font-display text-[34px] font-semibold leading-[1.05] outline-none sm:text-[42px]">
        {title}
      </h1>
      {hint && <p className="mt-2 text-[16px] text-cocoa-soft">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * A short sideways shake on the element whenever a (new) error appears. Uses the Web Animations API so the
 * element is never remounted (remounting would drop keyboard focus). Skipped under prefers-reduced-motion.
 */
function useShake(error: string | undefined) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!error || !ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(0)" }],
      { duration: 320, easing: "ease-in-out" },
    );
  }, [error]);
  return ref;
}

function Choice({
  name,
  label,
  value,
  onChange,
  options,
  error,
  cols,
  optionClass = "p-4 text-center",
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; content: React.ReactNode; highlight?: boolean }[];
  error?: string;
  cols: string;
  optionClass?: string;
}) {
  const selectedIdx = options.findIndex((o) => o.id === value);
  const shakeRef = useShake(error);
  return (
    <div>
      <div
        role="radiogroup"
        aria-label={label}
        aria-describedby={error ? `err-${name}` : undefined}
        aria-invalid={error ? true : undefined}
        ref={shakeRef}
        className={`gap-3 ${/(^|\s)flex(\s|$)/.test(cols) ? "" : "grid"} ${cols}`}
      >
        {options.map((o, i) => {
          const on = value === o.id;
          const tabbable = selectedIdx === -1 ? i === 0 : on;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={tabbable ? 0 : -1}
              data-field={tabbable ? name : undefined}
              onClick={() => onChange(o.id)}
              onKeyDown={radioKeys}
              className={`relative min-h-[64px] rounded-2xl border-2 transition-colors ${optionClass} ${
                on ? "border-cocoa bg-white shadow-[inset_0_0_0_1px_#3E2318]" : o.highlight ? "border-rose-deep bg-rose-wash/40 hover:border-cocoa/60" : "border-cream-line bg-white hover:border-cocoa/60"
              }`}
            >
              {on && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white ring-2 ring-cream">
                  <Icon name="check" className="h-4 w-4" />
                </span>
              )}
              {o.content}
            </button>
          );
        })}
      </div>
      {error && (
        <p id={`err-${name}`} role="alert" className="err">
          {error}
        </p>
      )}
    </div>
  );
}

function TextField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  className = "",
  ...rest
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id">) {
  const describedBy = [hint ? `hint-${id}` : "", error ? `err-${id}` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={`f-${id}`} className="label">
        {label}
      </label>
      <input
        id={`f-${id}`}
        data-field={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className="field"
        {...rest}
      />
      {hint && (
        <p id={`hint-${id}`} className="mt-1.5 text-[13px] text-cocoa-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`err-${id}`} className="err">
          {error}
        </p>
      )}
    </div>
  );
}

/** Guest stepper, used on Size and again on the tiered quote screen. */
function GuestField({ value, onChange, error, className = "" }: { value: string; onChange: (v: string) => void; error?: string; className?: string }) {
  const { t } = useApp();
  const rec = sizeForGuests(Number(value));
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-[0_1px_0_#E6D5BE] sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <label htmlFor="f-guests" className="text-[16px] font-extrabold">
          {t("cake.s2.guests")}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t("cake.s2.fewer")}
            onClick={() => onChange(String(Math.max(1, (Number(value) || 0) - 5)))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-cream-line text-[22px] font-bold hover:border-cocoa"
          >
            −
          </button>
          <input
            id="f-guests"
            data-field="guests"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="20"
            aria-invalid={!!error}
            aria-describedby="guests-suggest"
            className="field w-20 text-center text-[18px] font-bold tabular-nums"
          />
          <button
            type="button"
            aria-label={t("cake.s2.more")}
            onClick={() => onChange(String(Number(value) ? Number(value) + 5 : 10))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-cream-line text-[22px] font-bold hover:border-cocoa"
          >
            +
          </button>
        </div>
        <p id="guests-suggest" role="status" className="text-[15px] font-semibold text-cocoa-soft">
          {rec ? t("cake.s2.suggest", { size: t(`cake.size.${rec}` as Key), n: value }) : t("cake.s2.guestsHint")}
        </p>
      </div>
      {error && <p className="err">{error}</p>}
    </div>
  );
}

function DesignStep({
  s,
  update,
  photos,
  setPhotos,
  errors,
  setErrors,
}: {
  s: CakeState;
  update: <K extends keyof CakeState>(k: K, v: CakeState[K]) => void;
  photos: string[];
  setPhotos: (p: string[]) => void;
  errors: Errors;
  setErrors: React.Dispatch<React.SetStateAction<Errors>>;
}) {
  const { t } = useApp();
  const insp = galleryById(s.start);
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const colorNames = s.colorIds.map((c) => t(`cake.color.${c}` as Key)).join(", ");
  const addonNames = s.addons.map((a) => t(`cake.addon.${a}` as Key)).join(", ");

  return (
    <div className="space-y-2 md:space-y-10">
      <Section title={t("cake.s4.photo")} defaultOpen summary={photos.length ? String(photos.length) : undefined}>
        <PhotoPicker photos={photos} setPhotos={setPhotos} max={isQuote(s) ? 4 : 1} error={errors.photo} setError={(m) => setErrors((x) => ({ ...x, photo: m }))} />
        {insp && (
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-white p-3 pr-5 shadow-[0_1px_0_#E6D5BE]">
            <Photo id={insp.id} alt="" className="h-20 w-20 shrink-0 rounded-xl" />
            <div>
              <p className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.inspiration")}</p>
              <p className="text-[16px] font-bold leading-snug">{t(insp.key)}</p>
              <p className="text-[14px] text-cocoa-soft">{t("cake.inspirationNote")}</p>
            </div>
          </div>
        )}
      </Section>

      <Section title={t("cake.s4.message")} defaultOpen summary={s.message ? `“${s.message}”` : undefined}>
        <label htmlFor="f-message" className="sr-only">
          {t("cake.s4.message")}
        </label>
        <input
          id="f-message"
          value={s.message}
          maxLength={40}
          onChange={(e) => update("message", e.target.value.slice(0, 40))}
          placeholder={t("cake.s4.messagePh")}
          aria-describedby="message-count"
          className="field"
        />
        <p id="message-count" className={`mt-1.5 text-right text-[13px] font-semibold ${s.message.length >= 40 ? "text-brand-deep" : "text-cocoa-soft"}`}>
          {t("cake.s4.chars", { n: s.message.length })}
        </p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[14px] font-bold">{t("cake.s4.lettering")}</p>
            <Pills
              label={t("cake.s4.lettering")}
              value={s.lettering}
              onChange={(v) => update("lettering", v as CakeState["lettering"])}
              options={[
                { id: "script", label: t("cake.s4.lettering.script") },
                { id: "print", label: t("cake.s4.lettering.print") },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-[14px] font-bold">{t("cake.s4.placement")}</p>
            <Pills
              label={t("cake.s4.placement")}
              value={s.placement}
              onChange={(v) => update("placement", v as CakeState["placement"])}
              options={[
                { id: "top", label: t("cake.s4.placement.top") },
                { id: "side", label: t("cake.s4.placement.side") },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title={t("cake.s4.colors")} summary={colorNames || undefined}>
        <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={t("cake.s4.colorIdeas")}>
          {CAKES.colorIdeas.map((c) => {
            const on = s.colorIds.includes(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => update("colorIds", toggle(s.colorIds, c))}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-2 px-3.5 text-[14px] font-bold transition-colors ${
                  on ? "border-cocoa bg-cocoa text-cream" : "border-cream-line bg-white hover:border-cocoa/60"
                }`}
              >
                {on && <Icon name="check" className="h-4 w-4" />}
                {t(`cake.color.${c}` as Key)}
              </button>
            );
          })}
        </div>
        <label htmlFor="f-colors" className="label">
          {t("cake.s4.details")}
        </label>
        <textarea id="f-colors" rows={2} value={s.colors} onChange={(e) => update("colors", e.target.value.slice(0, 300))} placeholder={t("cake.s4.colorsPh")} className="field" />
      </Section>

      {/* extras with their price delta, added to the live estimate */}
      <Section title={t("cake.s4.addons")} summary={addonNames || undefined}>
        <p className="mb-4 text-[15px] text-cocoa-soft">{t("cake.s4.addonsHint")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CAKES.addons.map((a) => {
            const on = s.addons.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => update("addons", toggle(s.addons, a.id))}
                className={`flex min-h-[56px] items-center gap-3 rounded-2xl border-2 px-4 text-left transition-colors ${
                  on ? "border-cocoa bg-white shadow-[inset_0_0_0_1px_#3E2318]" : "border-cream-line bg-white hover:border-cocoa/60"
                }`}
              >
                <span aria-hidden className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-cocoa bg-cocoa text-cream" : "border-cream-line"}`}>
                  {on && <Icon name="check" className="h-4 w-4" />}
                </span>
                <span className="flex-1 text-[16px] font-bold">{t(`cake.addon.${a.id}` as Key)}</span>
                <span className="text-[15px] font-extrabold tabular-nums">{t("cake.plus", { n: a.price })}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* kept out of the collapsibles: allergy needs should never be hidden */}
      <fieldset className="pt-6 md:pt-0">
        <legend className="text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.s4.dietary")}</legend>
        <p className="mb-3 mt-1 text-[15px] text-cocoa-soft">{t("cake.s4.dietaryHint")}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {DIETARY.map((d) => (
            <label key={d} className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border-2 border-cream-line bg-white px-4 text-[15px] font-bold has-[:checked]:border-cocoa">
              <input type="checkbox" checked={s.dietary.includes(d)} onChange={() => update("dietary", toggle(s.dietary, d))} className="h-5 w-5 shrink-0 accent-[#3E2318]" />
              {t(`cake.diet.${d}` as Key)}
            </label>
          ))}
        </div>
        {s.dietary.includes("other") && (
          <div className="mt-3">
            <label htmlFor="f-diet-other" className="label">
              {t("cake.diet.otherLabel")}
            </label>
            <input id="f-diet-other" value={s.dietaryOther} maxLength={80} onChange={(e) => update("dietaryOther", e.target.value.slice(0, 80))} className="field" />
          </div>
        )}
      </fieldset>
    </div>
  );
}

/** Round "crumb" swatch for a sponge flavor, glossy swatch for a filling. Illustrated, not a photo. */
function Swatch({ color, kind, size = "md" }: { color: string; kind: "cake" | "filling"; size?: "sm" | "md" }) {
  const bg =
    kind === "cake"
      ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0 1.2px, transparent 2px) 0 0 / 8px 8px, radial-gradient(circle at 70% 70%, rgba(62,35,24,0.22) 0 1px, transparent 1.8px) 3px 2px / 7px 7px, ${color}`
      : `linear-gradient(155deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 45%), ${color}`;
  return (
    <span
      aria-hidden
      className={`block shrink-0 rounded-full border border-cocoa/15 shadow-[inset_0_-3px_6px_rgba(62,35,24,0.18)] ring-2 ring-white ${size === "sm" ? "h-8 w-8" : "h-11 w-11"}`}
      style={{ background: bg }}
    />
  );
}

function OptionBody({ swatch, pt, en, loved, premium }: { swatch: React.ReactNode; pt: string; en: string; loved?: boolean; premium?: number }) {
  const { t } = useApp();
  return (
    <span className="flex items-center gap-3 text-left">
      {swatch}
      <span className="min-w-0 flex-1">
        <span lang="pt-BR" className="block text-[16px] font-extrabold leading-tight">
          {pt}
        </span>
        <span lang="en" className="block text-[13px] text-cocoa-soft">
          {en}
        </span>
        {loved && (
          <span className="mt-1 inline-block rounded-full bg-brand-wash px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-deep">
            {t("cake.mostLoved")}
          </span>
        )}
      </span>
      {!!premium && <span className="shrink-0 self-start text-[13px] font-extrabold tabular-nums">{t("cake.plus", { n: premium })}</span>}
    </span>
  );
}

/** Line-by-line estimate. compact = sidebar (only the extras); full = Review (every line + total + note). */
function PriceLines({ s, compact = false }: { s: CakeState; compact?: boolean }) {
  const { t } = useApp();
  const est = estimate(s);
  if (est === "quote") {
    const box = docinhoBox(s.docinhos);
    return (
      <div className={`text-cocoa-soft ${compact ? "mt-2 text-[13px]" : "mt-2 text-[15px]"}`}>
        <p>{t("cake.quoteNote")}</p>
        {box && (
          <p className="mt-1 flex justify-between gap-4">
            <span>{t("cake.doc.line", { n: box.qty })}</span>
            <span className="tabular-nums">+${box.price}</span>
          </p>
        )}
      </div>
    );
  }
  if (!est) return null;
  const label = (l: (typeof est.lines)[number]) =>
    l.kind === "base"
      ? t("cake.base", { size: t(`cake.size.${l.id}` as Key) })
      : l.kind === "flavor"
        ? flavorById(l.id)!.pt
        : l.kind === "filling"
          ? fillingById(l.id)!.pt
          : l.kind === "style"
            ? t(`cake.style.${l.id}` as Key)
            : l.kind === "docinhos"
              ? t("cake.doc.line", { n: docinhoBox(l.id)!.qty })
              : t(`cake.addon.${l.id}` as Key);
  const lines = compact ? est.lines.filter((l) => l.kind !== "base") : est.lines;
  if (compact && !lines.length) return null;
  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      <dl className={compact ? "space-y-1 text-[13px] text-cocoa-soft" : "space-y-2 text-[16px]"}>
        {lines.map((l) => (
          <div key={l.kind + l.id} className="flex justify-between gap-4">
            <dt>{label(l)}</dt>
            <dd className="tabular-nums">{l.kind === "base" ? `$${l.amount}` : `+$${l.amount}`}</dd>
          </div>
        ))}
      </dl>
      {!compact && (
        <>
          <div className="mt-3 flex items-baseline justify-between border-t border-cream-line pt-3">
            <span className="text-[16px] font-extrabold">{t("cake.estimate")}</span>
            <span className="font-display text-[26px] font-semibold tabular-nums">${est.total}</span>
          </div>
          <p className="mt-1 text-[14px] text-cocoa-soft">{t("cake.priceNote")}</p>
        </>
      )}
    </div>
  );
}

function MiniSummary({ s }: { s: CakeState }) {
  const { t, lang } = useApp();
  const rows: [string, string][] = [];
  const size = sizeById(s.size);
  const insp = galleryById(s.start);
  if (insp) rows.push([t("cake.inspiration"), t(insp.key)]);
  if (size) rows.push([t("cake.s2"), `${t(`cake.size.${size.id}` as Key)} · ${t("cake.serves", { n: size.serves })}`]);
  if (s.flavor) rows.push([t("cake.s3.flavor"), flavorById(s.flavor)!.pt]);
  if (s.filling) rows.push([t("cake.s3.filling"), fillingById(s.filling)!.pt]);
  if (s.style) rows.push([t("cake.style"), t(`cake.style.${s.style}` as Key)]);
  if (s.addons.length) rows.push([t("cake.addonsLabel"), s.addons.map((a) => t(`cake.addon.${a}` as Key)).join(", ")]);
  if (s.colorIds.length) rows.push([t("cake.colorsLine"), s.colorIds.map((c) => t(`cake.color.${c}` as Key)).join(", ")]);
  if (s.message) rows.push([t("cake.s4.message"), messageLine(s, t)]);
  if (s.dietary.length) rows.push([t("cake.s4.dietary"), dietaryLine(s, t)]);
  if (docinhoBox(s.docinhos)) rows.push([t("cake.doc.label"), t("cake.doc.line", { n: docinhoBox(s.docinhos)!.qty })]);
  if (s.date) rows.push([t(isQuote(s) ? "cake.q.date" : "cake.s5"), `${fmtDate(s.date, lang, { weekday: "short", month: "short", day: "numeric" })}${s.time && !isQuote(s) ? ` · ${fmtTime(s.time, lang)}` : ""}`]);
  if (isQuote(s) && s.guests) rows.push([t("cake.s2.guests"), s.guests]);
  if (isQuote(s) && s.budget) rows.push([t("cake.q.budget"), t(`cake.q.b.${s.budget}` as Key)]);
  if (!rows.length) return <p className="mt-5 text-[15px] text-cocoa-soft">{t("cake.nothingYet")}</p>;
  return (
    <dl className="mt-5 space-y-2.5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 text-[15px]">
          <dt className="text-cocoa-soft">{k}</dt>
          <dd className="text-right font-bold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Full order summary used on Review (with Edit links) and on the confirmation screen. */
function Summary({ s, photos, onEdit }: { s: CakeState; photos: string[]; onEdit?: (n: number) => void }) {
  const { t, lang } = useApp();
  const size = sizeById(s.size);
  const flavor = flavorById(s.flavor);
  const filling = fillingById(s.filling);
  const occ = OCCASIONS.find((o) => o.id === s.occasion);
  const blocks: { n: number; title: string; lines: React.ReactNode[] }[] = [
    {
      n: 1,
      title: t("cake.s1"),
      lines: [
        <span key="o">
          {t("cake.occasion")}: <strong>{occ ? t(occ.key) : t("cake.none")}</strong>
        </span>,
        <span key="i">
          {t("cake.inspiration")}: <strong>{galleryById(s.start) ? t(galleryById(s.start)!.key) : t("cake.s1.scratch")}</strong>
        </span>,
        ...(galleryById(s.start) ? [<Photo key="p" id={s.start} alt="" className="mt-1 h-20 w-20 rounded-xl" />] : []),
      ],
    },
    {
      n: 2,
      title: t("cake.s2"),
      lines: size
        ? [`${t(`cake.size.${size.id}` as Key)} · ${t("cake.serves", { n: size.serves })}`, size.from != null ? t("cake.from", { price: size.from }) : t("cake.quote")]
        : ["—"],
    },
    {
      n: 3,
      title: t("cake.s3"),
      lines: [
        <span key="f">
          {t("cake.s3.flavor")}: <strong lang="pt-BR">{flavor?.pt ?? "—"}</strong>
        </span>,
        <span key="r">
          {t("cake.s3.filling")}: <strong lang="pt-BR">{filling?.pt ?? "—"}</strong>
        </span>,
      ],
    },
    {
      n: 4,
      title: t("cake.s4"),
      lines: [
        <span key="st">
          {t("cake.style")}: <strong>{s.style ? t(`cake.style.${s.style}` as Key) : t("cake.none")}</strong>
        </span>,
        ...(s.addons.length
          ? [
              <span key="ad">
                {t("cake.addonsLabel")}: <strong>{s.addons.map((a) => t(`cake.addon.${a}` as Key)).join(", ")}</strong>
              </span>,
            ]
          : []),
        <span key="m">
          {t("cake.s4.message")}: <strong>{s.message ? messageLine(s, t) : t("cake.none")}</strong>
        </span>,
        <span key="c">
          {t("cake.colorsLine")}: <strong>{s.colorIds.length ? s.colorIds.map((c) => t(`cake.color.${c}` as Key)).join(", ") : t("cake.none")}</strong>
        </span>,
        ...(s.colors
          ? [
              <span key="x">
                {t("cake.s4.details")}: <strong>{s.colors}</strong>
              </span>,
            ]
          : []),
        <span key="d">
          {t("cake.s4.dietary")}: <strong>{s.dietary.length ? dietaryLine(s, t) : t("cake.none")}</strong>
        </span>,
        ...(photos.length
          ? [
              <span key="p" className="mt-1 flex flex-wrap gap-2">
                {photos.map((u) => (
                  <img key={u} src={u} alt={t("cake.s4.photoAlt")} className="h-20 w-20 rounded-xl object-cover" />
                ))}
              </span>,
            ]
          : []),
      ],
    },
    isQuote(s)
      ? {
          n: 5,
          title: t("cake.q.step"),
          lines: [
            `${t("cake.q.date")}: ${s.date ? fmtDate(s.date, lang) : "—"}`,
            `${t("cake.s2.guests")} ${s.guests || "—"}`,
            `${t("cake.q.budget")}: ${s.budget ? t(`cake.q.b.${s.budget}` as Key) : t("cake.none")}`,
          ],
        }
      : { n: 5, title: t("cake.s5"), lines: s.date ? [fmtDate(s.date, lang), s.time ? fmtTime(s.time, lang) : "—"] : ["—"] },
    { n: 5, title: t("cake.s6"), lines: [s.name || "—", prettyPhone(s.phone), s.email, ...(s.notes ? [s.notes] : [])].filter(Boolean) },
  ];
  return (
    <div className="space-y-3">
      {blocks.map((b) => (
        <div key={b.title} className="rounded-2xl border-2 border-cream-line bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-cocoa-soft">{b.title}</h2>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(b.n)}
                aria-label={`${t("cake.edit")}: ${b.title}`}
                className="-mr-2 -mt-2 inline-flex min-h-[44px] items-center rounded-full px-3 text-[15px] font-bold text-brand-deep underline underline-offset-4 hover:bg-brand-wash"
              >
                {t("cake.edit")}
              </button>
            )}
          </div>
          <div className="mt-1 space-y-0.5 break-words text-[16px]">
            {b.lines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type T = (k: Key, v?: Record<string, string | number>) => string;
const messageLine = (s: CakeState, t: T) => `“${s.message}” · ${t(`cake.s4.lettering.${s.lettering}` as Key)}, ${t(`cake.s4.placement.${s.placement}` as Key).toLowerCase()}`;
const dietaryLine = (s: CakeState, t: T) =>
  s.dietary.map((d) => (d === "other" ? s.dietaryOther.trim() || t("cake.diet.other") : t(`cake.diet.${d}` as Key))).join(", ");
/** A restored design keeps the contact details this visitor already typed; the link never carries any. */
const withContact = (shared: CakeState, own: CakeState): CakeState => ({ ...shared, name: own.name, phone: own.phone, email: own.email, notes: own.notes });

/**
 * The cake view: always a photo (see CakePhoto), labeled when it's one of Marcia's cakes.
 */
function CakeStage({ s, heightClass = "aspect-[10/9] lg:aspect-[4/3]" }: { s: CakeState; heightClass?: string }) {
  const insp = galleryById(s.start);
  const inspired = useInspiredLabel(s);
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_35%,#FFFDF8_0%,#F6EBDC_70%)]">
      <div className={`w-full ${heightClass}`}>
        <CakePhoto s={s} />
      </div>
      {insp && (
        <span className="absolute left-3 right-3 top-3 w-fit max-w-[calc(100%-24px)] truncate rounded-full bg-cocoa/85 px-3 py-1 text-[12px] font-extrabold text-cream backdrop-blur">
          {inspired}
        </span>
      )}
    </div>
  );
}

/** Full-screen "Your cake" view on phones. Focus moves in, Esc / Close return focus to the strip. */
function CakeSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const { t } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cake-sheet-title" className="fixed inset-0 z-[60] overflow-y-auto bg-cream px-4 pb-10 pt-3 lg:hidden">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <h2 id="cake-sheet-title" className="font-display text-[26px] font-semibold">
            {t("cake.summary")}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t("a11y.close")} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-cream-deep">
            <Icon name="close" className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-3 rounded-3xl bg-white p-4 shadow-[0_1px_0_#E6D5BE]">{children}</div>
        <button type="button" onClick={onClose} className="btn-primary mt-5 w-full">
          {t("cake.backToSteps")}
        </button>
      </div>
    </div>
  );
}

/** Builds a calendar file for the pickup (floating local time; 30 min) and hands it to the browser. */
function downloadIcs(s: CakeState, orderNo: string, t: (k: Key, v?: Record<string, string | number>) => string) {
  if (!s.date) return;
  const ymd = s.date.replace(/-/g, "");
  const [hh, mm] = (s.time || "12:00").split(":");
  const end = new Date(Date.UTC(2000, 0, 1, Number(hh), Number(mm) + 30));
  const endT = `${String(end.getUTCHours()).padStart(2, "0")}${String(end.getUTCMinutes()).padStart(2, "0")}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
  const addr = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postal}`;
  const desc = [`${t("cake.done.order")} ${orderNo}`, summaryLine(s, t), s.message ? `“${s.message}”` : "", site.phone.display].filter(Boolean).join("\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Brazilian Eats & Treats//Cake order//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${orderNo}@brazilianeatsandtreats`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${ymd}T${hh}${mm}00`,
    `DTEND:${ymd}T${endT}`,
    `SUMMARY:${esc(t("cake.ics.title"))}`,
    `LOCATION:${esc(addr)}`,
    `DESCRIPTION:${esc(desc)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `cake-pickup-${orderNo}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
