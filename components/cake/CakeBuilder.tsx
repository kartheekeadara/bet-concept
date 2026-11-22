"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Key } from "@/data/i18n";
import { useApp } from "@/lib/lang";
import { fmtTime } from "@/lib/hours";
import { Icon, SampleTag } from "@/components/ui";
import {
  CAKES,
  EMPTY,
  OCCASIONS,
  type CakeState,
  addDays,
  earliestDate,
  emailOk,
  fillingById,
  flavorById,
  fmtDate,
  isDateAllowed,
  leadDaysFor,
  phoneDigits,
  sizeById,
  slotsFor,
  todayYMD,
} from "@/components/cake/cakeData";
import { Calendar } from "@/components/cake/Calendar";
import { CakePreview } from "@/components/cake/CakePreview";

const TOTAL = 7;
const prettyPhone = (p: string) => {
  const d = phoneDigits(p);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
};
const STORE_KEY = "bet-cake-v1";
type Errors = Partial<Record<keyof CakeState | "photo", string>>;

export function CakeBuilder() {
  const { t, lang } = useApp();
  const [s, setS] = useState<CakeState>(EMPTY);
  const [step, setStep] = useState(1);
  const [reached, setReached] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  /* ── restore progress (sessionStorage) and the step from the URL hash ── */
  useEffect(() => {
    let restoredReached = 1;
    try {
      const raw = window.sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { s: CakeState; reached: number };
        setS({ ...EMPTY, ...saved.s });
        restoredReached = Math.min(Math.max(1, saved.reached || 1), TOTAL);
        setReached(restoredReached);
      }
    } catch {
      /* storage blocked: start fresh */
    }
    const m = window.location.hash.match(/step-(\d)/);
    const fromHash = m ? Number(m[1]) : 1;
    const start = Math.min(fromHash, restoredReached);
    setStep(start);
    window.history.replaceState({ step: start }, "", `#step-${start}`);
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
      const next = { ...prev, [k]: v };
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
      if (n === 1 && !s.occasion) e.occasion = t("cake.err.occasion");
      if (n === 2 && !s.size) e.size = t("cake.err.size");
      if (n === 3) {
        if (!s.flavor) e.flavor = t("cake.err.flavor");
        if (!s.filling) e.filling = t("cake.err.filling");
      }
      if (n === 5) {
        if (!s.date || !isDateAllowed(s.date, s.size)) e.date = s.date ? t("cake.err.dateLead") : t("cake.err.date");
        else if (!s.time) e.time = t("cake.err.time");
      }
      if (n === 6) {
        if (!s.name.trim()) e.name = t("form.required");
        if (phoneDigits(s.phone).length !== 10) e.phone = t("form.phone");
        if (!emailOk(s.email)) e.email = t("form.email");
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
      // Came here from Review's "Edit"? Go straight back to Review (payDeposit re-checks every step).
      const target = reached >= TOTAL ? TOTAL : step + 1;
      setReached((r) => Math.max(r, step + 1));
      goTo(target);
    }
  };

  const back = () => {
    if (step > 1) window.history.back();
  };

  /** The deposit is mocked for the concept. */
  const payDeposit = () => {
    // Re-check every step in case something was edited into an invalid state.
    for (let n = 1; n <= 6; n++) {
      const e = validate(n);
      if (Object.keys(e).length) {
        setErrors(e);
        goTo(n);
        return;
      }
    }
    // Live version: Stripe/Square checkout; money goes straight to the bakery.
    const no = `BET-${String(Date.now()).slice(-5)}`;
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
    setPhotoUrl(null);
    setStep(1);
    window.history.replaceState({ step: 1 }, "", "#step-1");
  };

  const size = sizeById(s.size);
  const estimate = size ? (size.from != null ? t("cake.from", { price: size.from }) : t("cake.quote")) : "—";
  const stepLabels: Key[] = ["cake.s1", "cake.s2", "cake.s3", "cake.s4", "cake.s5", "cake.s6", "cake.s7"];

  if (orderNo) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="rounded-3xl bg-white p-6 text-center shadow-[0_1px_0_#E6D5BE] sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink text-white">
            <Icon name="check" className="h-9 w-9" />
          </span>
          <h1 ref={headingRef} tabIndex={-1} className="mt-5 font-display text-[40px] font-semibold leading-tight outline-none">
            {t("cake.done.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[18px] leading-relaxed">{t("cake.done.body")}</p>
          <p className="mt-6 text-[14px] font-bold uppercase tracking-[0.14em] text-cocoa-soft">{t("cake.done.order")}</p>
          <p className="font-display text-[32px] font-semibold tabular-nums text-pink-deep">{orderNo}</p>
        </div>
        <div className="mt-6">
          <Summary s={s} photoUrl={photoUrl} />
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="btn-primary">
            {t("cake.done.home")}
          </Link>
          <button type="button" onClick={restart} className="btn-ghost">
            {t("cake.done.new")}
          </button>
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
      <p className="mt-2 font-display text-[18px] italic text-pink-deep">{t("cake.pageTitle")}</p>

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
                    isCur ? "bg-pink text-white" : n < step || n < reached ? "bg-cocoa text-cream" : "border-2 border-cream-line bg-white"
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
          <div className="h-full rounded-full bg-pink transition-[width] duration-300" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className={hydrated ? "" : "invisible"}>
          {step === 1 && (
            <Step title={t("cake.s1.title")} headingRef={headingRef}>
              <Choice
                name="occasion"
                value={s.occasion}
                onChange={(v) => update("occasion", v)}
                error={errors.occasion}
                cols="grid-cols-2 sm:grid-cols-3"
                options={OCCASIONS.map((o) => ({
                  id: o.id,
                  content: (
                    <>
                      <span aria-hidden className="text-[28px] leading-none">
                        {o.glyph}
                      </span>
                      <span className="mt-2 block text-[17px] font-extrabold">{t(o.key)}</span>
                    </>
                  ),
                }))}
              />
            </Step>
          )}

          {step === 2 && (
            <Step title={t("cake.s2.title")} hint={t("cake.s2.hint")} headingRef={headingRef}>
              <Choice
                name="size"
                value={s.size}
                onChange={(v) => update("size", v)}
                error={errors.size}
                cols="grid-cols-2 sm:grid-cols-4"
                options={CAKES.sizes.map((z) => ({
                  id: z.id,
                  content: (
                    <>
                      <span className="block font-display text-[34px] font-semibold leading-none">{z.id === "tiered" ? t("cake.tiered") : z.label}</span>
                      <span className="mt-2 block text-[16px] font-extrabold">{t("cake.serves", { n: z.serves })}</span>
                      <span className="mt-1 block text-[14px] font-semibold text-cocoa-soft">
                        {z.from != null ? t("cake.from", { price: z.from }) : t("cake.quote")}
                      </span>
                      {z.tiers > 1 && (
                        <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-pink-deep">
                          <Icon name="clock" className="h-3.5 w-3.5" /> 14 {lang === "pt" ? "dias" : "days"}
                        </span>
                      )}
                    </>
                  ),
                }))}
              />
              <p className="mt-4 flex items-center gap-2 text-[14px] text-cocoa-soft">
                <SampleTag /> {t("cake.sampleNote")}
              </p>
            </Step>
          )}

          {step === 3 && (
            <Step title={t("cake.s3.title")} headingRef={headingRef}>
              <h3 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.s3.flavor")}</h3>
              <Choice
                name="flavor"
                value={s.flavor}
                onChange={(v) => update("flavor", v)}
                error={errors.flavor}
                cols="grid-cols-2 sm:grid-cols-3"
                options={CAKES.flavors.map((f) => ({
                  id: f.id,
                  content: (
                    <span className="flex items-center gap-3 text-left">
                      <span aria-hidden className="h-8 w-8 shrink-0 rounded-full border border-cocoa/20" style={{ background: f.color }} />
                      <span>
                        <span lang="pt-BR" className="block text-[16px] font-extrabold leading-tight">
                          {f.pt}
                        </span>
                        <span lang="en" className="block text-[13px] text-cocoa-soft">
                          {f.en}
                        </span>
                      </span>
                    </span>
                  ),
                }))}
              />
              <h3 className="mb-3 mt-8 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.s3.filling")}</h3>
              <Choice
                name="filling"
                value={s.filling}
                onChange={(v) => update("filling", v)}
                error={errors.filling}
                cols="grid-cols-2 sm:grid-cols-3"
                options={CAKES.fillings.map((f) => ({
                  id: f.id,
                  content: (
                    <span className="block text-left">
                      <span lang="pt-BR" className="block text-[16px] font-extrabold leading-tight">
                        {f.pt}
                      </span>
                      <span lang="en" className="block text-[13px] text-cocoa-soft">
                        {f.en}
                      </span>
                    </span>
                  ),
                }))}
              />
            </Step>
          )}

          {step === 4 && (
            <Step title={t("cake.s4.title")} hint={t("cake.s4.hint")} headingRef={headingRef}>
              <DesignStep s={s} update={update} photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} errors={errors} setErrors={setErrors} />
            </Step>
          )}

          {step === 5 && (
            <Step title={t("cake.s5.title")} headingRef={headingRef}>
              <p className="mb-4 rounded-xl bg-pink-wash px-4 py-3 text-[15px] font-semibold">
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
              <p className="mt-2 text-[13px] text-cocoa-soft">{t("cake.s5.closedMon")}</p>

              <fieldset className="mt-8">
                <legend className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.12em] text-cocoa-soft">{t("cake.s5.time")}</legend>
                {s.date ? (
                  <>
                    <p className="mb-3 text-[16px] font-bold">{fmtDate(s.date, lang)}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-describedby={errors.time ? "err-time" : undefined}>
                      {slotsFor(s.date).map((slot, i) => {
                        const on = s.time === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            data-field={i === 0 ? "time" : undefined}
                            onClick={() => update("time", slot)}
                            className={`min-h-[48px] rounded-xl border-2 text-[15px] font-bold tabular-nums ${
                              on ? "border-cocoa bg-cocoa text-cream" : "border-cream-line bg-white hover:border-cocoa"
                            }`}
                          >
                            {fmtTime(slot, lang)}
                          </button>
                        );
                      })}
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
              </fieldset>
            </Step>
          )}

          {step === 6 && (
            <Step title={t("cake.s6.title")} headingRef={headingRef}>
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
                  label={t("cake.s6.email")}
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

          {step === 7 && (
            <Step title={t("cake.s7.title")} headingRef={headingRef}>
              <Summary s={s} photoUrl={photoUrl} onEdit={goTo} />
              <div className="mt-6 rounded-2xl border-2 border-pink bg-pink-wash p-5">
                <p className="font-display text-[22px] font-semibold">{t("cake.s7.deposit", { amount: CAKES.deposit })}</p>
                <p className="mt-1 text-[15px]">{t("cake.s7.depositNote")}</p>
              </div>
              <button type="button" onClick={payDeposit} className="btn-primary mt-6 hidden w-full min-h-[56px] text-[18px] lg:flex">
                {t("cake.s7.pay", { amount: CAKES.deposit })}
              </button>
              <p className="mt-3 text-center text-[13px] text-cocoa-soft">{t("cake.s7.mock")}</p>
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

        {/* Desktop sticky summary panel */}
        <aside className="sticky top-[92px] hidden rounded-3xl bg-white p-6 shadow-[0_1px_0_#E6D5BE,0_20px_40px_-24px_rgba(62,35,24,0.35)] lg:block" aria-label={t("cake.summary")}>
          <div className="flex items-center gap-4">
            <CakePreview s={s} className="h-24 w-24 shrink-0 rounded-2xl bg-cream" />
            <div>
              <p className="font-display text-[22px] font-semibold">{t("cake.summary")}</p>
              {s.occasion && <p className="text-[15px] text-cocoa-soft">{t(OCCASIONS.find((o) => o.id === s.occasion)!.key)}</p>}
            </div>
          </div>
          <MiniSummary s={s} />
          <div className="mt-5 border-t border-cream-line pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold">{t("cake.estimate")}</span>
              <span className="font-display text-[24px] font-semibold">{estimate}</span>
            </div>
            <p className="mt-1 flex items-center gap-2 text-[13px] text-cocoa-soft">
              <SampleTag /> {t("cake.s7.deposit", { amount: CAKES.deposit })}
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky bottom bar: estimate + Continue */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-line bg-cream/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold uppercase tracking-wider text-cocoa-soft">{t("cake.estimate")}</p>
            <p className="truncate font-display text-[20px] font-semibold leading-tight">{estimate}</p>
          </div>
          {step < TOTAL ? (
            <button type="button" onClick={next} className="btn-primary min-w-[150px]">
              {t("cake.continue")}
            </button>
          ) : (
            <button type="button" onClick={payDeposit} className="btn-primary">
              {t("cake.s7.pay", { amount: CAKES.deposit })}
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

function Choice({
  name,
  value,
  onChange,
  options,
  error,
  cols,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; content: React.ReactNode }[];
  error?: string;
  cols: string;
}) {
  return (
    <div>
      <div role="radiogroup" aria-label={name} aria-describedby={error ? `err-${name}` : undefined} className={`grid gap-3 ${cols}`}>
        {options.map((o, i) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              data-field={i === 0 ? name : undefined}
              onClick={() => onChange(o.id)}
              className={`relative min-h-[64px] rounded-2xl border-2 p-4 text-center transition-colors ${
                on ? "border-cocoa bg-white shadow-[inset_0_0_0_1px_#3E2318]" : error ? "border-pink/60 bg-white" : "border-cream-line bg-white hover:border-cocoa/60"
              }`}
            >
              {on && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink text-white ring-2 ring-cream">
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

function DesignStep({
  s,
  update,
  photoUrl,
  setPhotoUrl,
  errors,
  setErrors,
}: {
  s: CakeState;
  update: <K extends keyof CakeState>(k: K, v: CakeState[K]) => void;
  photoUrl: string | null;
  setPhotoUrl: (u: string | null) => void;
  errors: Errors;
  setErrors: React.Dispatch<React.SetStateAction<Errors>>;
}) {
  const { t } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/") || f.size > 10 * 1024 * 1024) {
      setErrors((x) => ({ ...x, photo: t("cake.err.photo") }));
      return;
    }
    setErrors((x) => ({ ...x, photo: undefined }));
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    // Preview only: the file never leaves the device in the concept.
    setPhotoUrl(URL.createObjectURL(f));
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="label">{t("cake.s4.photo")}</p>
        <input ref={fileRef} id="f-photo" type="file" accept="image/*" onChange={onFile} className="sr-only" aria-describedby="photo-note" />
        {photoUrl ? (
          <div className="flex flex-wrap items-end gap-4">
            <img src={photoUrl} alt={t("cake.s4.photoAlt")} className="h-40 w-40 rounded-2xl object-cover" />
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost min-h-[44px] px-4 text-[15px]">
                {t("cake.s4.photoChange")}
              </button>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(photoUrl);
                  setPhotoUrl(null);
                }}
                className="inline-flex min-h-[44px] items-center px-4 text-[15px] font-bold text-pink-deep underline"
              >
                {t("cake.s4.photoRemove")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cocoa/30 bg-white px-4 py-8 text-[16px] font-bold hover:border-cocoa"
          >
            <Icon name="upload" className="h-7 w-7 text-pink" />
            {t("cake.s4.photoBtn")}
          </button>
        )}
        <p id="photo-note" className="mt-2 text-[13px] text-cocoa-soft">
          {t("cake.s4.photoNote")}
        </p>
        {errors.photo && <p className="err">{errors.photo}</p>}
      </div>

      <div>
        <label htmlFor="f-message" className="label">
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
        <p id="message-count" className={`mt-1.5 text-right text-[13px] font-semibold ${s.message.length >= 40 ? "text-pink-deep" : "text-cocoa-soft"}`}>
          {t("cake.s4.chars", { n: s.message.length })}
        </p>
      </div>

      <div>
        <label htmlFor="f-colors" className="label">
          {t("cake.s4.colors")}
        </label>
        <textarea id="f-colors" rows={2} value={s.colors} onChange={(e) => update("colors", e.target.value)} placeholder={t("cake.s4.colorsPh")} className="field" />
      </div>
    </div>
  );
}

function MiniSummary({ s }: { s: CakeState }) {
  const { t, lang } = useApp();
  const rows: [string, string][] = [];
  const size = sizeById(s.size);
  if (size) rows.push([t("cake.s2"), `${t(`cake.size.${size.id}` as Key)} · ${t("cake.serves", { n: size.serves })}`]);
  if (s.flavor) rows.push([t("cake.s3.flavor"), flavorById(s.flavor)!.pt]);
  if (s.filling) rows.push([t("cake.s3.filling"), fillingById(s.filling)!.pt]);
  if (s.message) rows.push([t("cake.s4.message"), `“${s.message}”`]);
  if (s.date) rows.push([t("cake.s5"), `${fmtDate(s.date, lang, { weekday: "short", month: "short", day: "numeric" })}${s.time ? ` · ${fmtTime(s.time, lang)}` : ""}`]);
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
function Summary({ s, photoUrl, onEdit }: { s: CakeState; photoUrl: string | null; onEdit?: (n: number) => void }) {
  const { t, lang } = useApp();
  const size = sizeById(s.size);
  const flavor = flavorById(s.flavor);
  const filling = fillingById(s.filling);
  const occ = OCCASIONS.find((o) => o.id === s.occasion);
  const blocks: { n: number; title: string; lines: React.ReactNode[] }[] = [
    { n: 1, title: t("cake.s1"), lines: [occ ? t(occ.key) : "—"] },
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
        <span key="m">
          {t("cake.s4.message")}: <strong>{s.message ? `“${s.message}”` : t("cake.none")}</strong>
        </span>,
        <span key="c">
          {t("cake.s4.colors")}: <strong>{s.colors || t("cake.none")}</strong>
        </span>,
        ...(photoUrl ? [<img key="p" src={photoUrl} alt={t("cake.s4.photoAlt")} className="mt-1 h-20 w-20 rounded-xl object-cover" />] : []),
      ],
    },
    { n: 5, title: t("cake.s5"), lines: s.date ? [fmtDate(s.date, lang), s.time ? fmtTime(s.time, lang) : "—"] : ["—"] },
    { n: 6, title: t("cake.s6"), lines: [s.name || "—", prettyPhone(s.phone), s.email, ...(s.notes ? [s.notes] : [])].filter(Boolean) },
  ];
  return (
    <div className="space-y-3">
      {blocks.map((b) => (
        <div key={b.n} className="rounded-2xl border-2 border-cream-line bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-cocoa-soft">{b.title}</h2>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(b.n)}
                aria-label={`${t("cake.edit")}: ${b.title}`}
                className="-mr-2 -mt-2 inline-flex min-h-[44px] items-center rounded-full px-3 text-[15px] font-bold text-pink-deep underline underline-offset-4 hover:bg-pink-wash"
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
