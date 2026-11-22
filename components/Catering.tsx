"use client";
import { useState } from "react";
import site from "@/data/site.json";
import { useApp } from "@/lib/lang";
import { Eyebrow, Icon, Photo, SampleTag } from "@/components/ui";
import type { Key } from "@/data/i18n";
import { digits } from "@/components/sections";

type Errors = Partial<Record<"name" | "phone" | "date" | "headcount", string>>;

export function Catering() {
  const { t } = useApp();
  const [f, setF] = useState({ name: "", phone: "", date: "", headcount: "", notes: "" });
  const [trays, setTrays] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF({ ...f, [k]: e.target.value });
    if (errors[k as keyof Errors]) setErrors({ ...errors, [k]: undefined });
  };
  const toggle = (id: string) => setTrays((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Errors = {};
    if (!f.name.trim()) err.name = t("form.required");
    if (digits(f.phone).length !== 10) err.phone = t("form.phone");
    if (!f.date) err.date = t("form.date");
    if (!f.headcount || Number(f.headcount) < 1) err.headcount = t("form.headcount");
    setErrors(err);
    const first = Object.keys(err)[0];
    if (first) return document.getElementById(`cat-${first}`)?.focus();
    // Mock: the live version emails/texts Marcia the request (e.g. Formspree or a small serverless function).
    setSent(true);
  };

  const field = (k: keyof Errors, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`cat-${k}`} className="label">
        {label}
      </label>
      <input
        id={`cat-${k}`}
        value={f[k]}
        onChange={set(k)}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `cat-${k}-err` : undefined}
        className="field"
        {...props}
      />
      {errors[k] && (
        <p id={`cat-${k}-err`} className="err">
          {errors[k]}
        </p>
      )}
    </div>
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section id="catering" aria-labelledby="catering-title" className="bg-cream-deep/60">
      <div className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-24">
        {/* intro: copy + what's in the tray, next to the real photo */}
        <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
          <div>
            <Eyebrow>{t("catering.eyebrow")}</Eyebrow>
            <h2 id="catering-title" className="h2">
              {t("catering.title")}
            </h2>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-cocoa-soft">{t("catering.body")}</p>
            <ul className="mt-6 space-y-3">
              {(["catering.pt1", "catering.pt2", "catering.pt3"] as const).map((k) => (
                <li key={k} className="flex items-start gap-3 text-[16px] font-semibold">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink text-white">
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>
          <Photo id="catering" alt={t("catering.photoAlt")} className="aspect-[4/3] w-full rounded-3xl" imgClassName="object-[center_62%]" />
        </div>

        {/* package cards (Whereby / Fiverr style): size, servings, price, one action that pre-fills the form */}
        <h3 className="mt-14 text-[15px] font-extrabold uppercase tracking-[0.14em] text-cocoa-soft">{t("catering.pick")}</h3>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {site.catering.trays.map((tr) => {
            const on = trays.includes(tr.id);
            return (
              <li
                key={tr.id}
                className={`flex flex-col rounded-3xl border-2 bg-white p-6 transition-colors ${on ? "border-cocoa" : "border-transparent shadow-[0_1px_0_#E6D5BE]"}`}
              >
                <p className="text-[15px] font-bold text-pink-deep">{t(`catering.size.${tr.id}` as Key)}</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-[48px] font-semibold leading-none tabular-nums">{tr.pieces}</span>
                  <span className="text-[16px] font-bold">{t("catering.tray")}</span>
                </p>
                <p className="mt-3 flex items-center gap-2 text-[15px] text-cocoa-soft">
                  <Icon name="users" className="h-[18px] w-[18px]" /> {t("catering.serves", { n: tr.serves })}
                </p>
                <div className="mt-5 flex items-center gap-2 border-t border-cream-line pt-4">
                  <span className="text-[20px] font-extrabold">{t("catering.from", { price: tr.from })}</span>
                  <SampleTag className="text-cocoa-soft" />
                </div>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    if (!on) setTrays((x) => [...x, tr.id]);
                    else setTrays((x) => x.filter((y) => y !== tr.id));
                    if (!on) window.setTimeout(() => document.getElementById("catering-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                  }}
                  className={`mt-5 ${on ? "btn bg-cocoa text-cream hover:bg-cocoa-deep" : "btn-ghost"}`}
                >
                  {on && <Icon name="check" className="h-4 w-4" />}
                  {on ? t("catering.chosen") : t("catering.choose")}
                </button>
              </li>
            );
          })}
        </ul>

      <div id="catering-form" className="mt-10 grid scroll-mt-24 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl bg-white p-5 shadow-[0_1px_0_#E6D5BE] sm:p-8">
          <h3 className="font-display text-[26px] font-semibold">{t("catering.form.title")}</h3>
          {sent ? (
            <div role="status" className="mt-6 rounded-2xl bg-pink-wash p-6">
              <p className="flex items-center gap-2 font-display text-[24px] font-semibold">
                <Icon name="check" className="h-7 w-7 text-pink" /> {t("catering.done.title")}
              </p>
              <p className="mt-2 text-[17px]">{t("catering.done.body", { phone: f.phone })}</p>
              <button
                type="button"
                className="btn-ghost mt-5"
                onClick={() => {
                  setSent(false);
                  setF({ name: "", phone: "", date: "", headcount: "", notes: "" });
                  setTrays([]);
                }}
              >
                {t("catering.done.again")}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
              {field("name", t("catering.form.name"), { autoComplete: "name" })}
              {field("phone", t("catering.form.phone"), { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "(704) 555-0123" })}
              {field("date", t("catering.form.date"), { type: "date", min: today })}
              {field("headcount", t("catering.form.headcount"), { type: "number", inputMode: "numeric", min: 1 })}
              <fieldset className="sm:col-span-2">
                <legend className="label">{t("catering.form.trays")}</legend>
                <div className="flex flex-wrap gap-2">
                  {site.catering.trays.map((tr) => {
                    const on = trays.includes(tr.id);
                    return (
                      <button
                        key={tr.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(tr.id)}
                        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-2 px-4 text-[15px] font-bold ${
                          on ? "border-cocoa bg-cocoa text-cream" : "border-cream-line bg-white text-cocoa hover:border-cocoa"
                        }`}
                      >
                        {on && <Icon name="check" className="h-4 w-4" />}
                        {t("catering.pieces", { n: tr.pieces })}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div className="sm:col-span-2">
                <label htmlFor="cat-notes" className="label">
                  {t("catering.form.notes")}
                </label>
                <textarea id="cat-notes" rows={3} value={f.notes} onChange={set("notes")} placeholder={t("catering.form.notesHint")} className="field" />
              </div>
              <button type="submit" className="btn-primary sm:col-span-2">
                {t("catering.form.submit")}
              </button>
            </form>
          )}
        </div>
        <aside className="self-start rounded-3xl bg-white p-6 sm:p-8">
          <p className="font-display text-[24px] font-semibold">{t("catering.prefer")}</p>
          <a href={`tel:${site.phone.tel}`} className="mt-4 flex min-h-[44px] items-center gap-3 text-[18px] font-extrabold hover:underline">
            <Icon name="phone" className="h-5 w-5 text-pink" /> {site.phone.display}
          </a>
          <a href={`mailto:${site.email}`} className="flex min-h-[44px] items-center gap-3 break-all text-[15px] font-semibold hover:underline">
            {site.email}
          </a>
          <a href={site.instagram.url} target="_blank" rel="noopener" className="flex min-h-[44px] items-center gap-3 text-[16px] font-semibold hover:underline">
            <Icon name="ig" className="h-5 w-5 text-pink" /> {site.instagram.handle}
          </a>
        </aside>
      </div>
      </div>
    </section>
  );
}
