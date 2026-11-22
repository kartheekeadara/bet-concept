"use client";
import { useState } from "react";
import site from "@/data/site.json";
import { useApp } from "@/lib/lang";
import { Icon, Photo } from "@/components/ui";
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
        {/* intro: copy + what's on the tray, next to the real tray photo */}
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-14">
          <div>
            <h2 id="catering-title" className="h2 sm:text-[56px]">
              {t("catering.title")}
            </h2>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-cocoa-soft">{t("catering.body")}</p>
            <ul className="mt-6 space-y-3">
              {(["catering.pt1", "catering.pt2", "catering.pt3"] as const).map((k) => (
                <li key={k} className="flex items-start gap-3 text-[16px] font-semibold">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>
          <Photo id="catering-tray" alt={t("catering.photoAlt")} className="aspect-square w-full rounded-3xl" />
        </div>

        {/* one request card: the tray choice IS the first field, then details; phone people get the aside */}
        <div id="catering-form" className="mt-14 grid scroll-mt-24 gap-6 lg:grid-cols-[1.7fr_1fr]">
          <div className="rounded-3xl bg-white p-5 shadow-[0_1px_0_#E6D5BE] sm:p-8">
            <h3 className="font-display text-[30px] font-bold leading-tight">{t("catering.form.title")}</h3>
            {sent ? (
              <div role="status" className="mt-6 rounded-2xl bg-brand-wash p-6">
                <p className="flex items-center gap-2 font-display text-[26px] font-bold">
                  <Icon name="check" className="h-7 w-7 text-brand" /> {t("catering.done.title")}
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
                <fieldset className="sm:col-span-2">
                  <legend className="label">{t("catering.pick")}</legend>
                  <div className="mt-1 grid gap-3 sm:grid-cols-3">
                    {site.catering.trays.map((tr) => {
                      const on = trays.includes(tr.id);
                      return (
                        <button
                          key={tr.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle(tr.id)}
                          className={`relative flex flex-col rounded-2xl border-2 p-4 text-left transition-colors ${
                            on ? "border-cocoa bg-cream" : "border-cream-line bg-white hover:border-cocoa/50"
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                              on ? "border-cocoa bg-cocoa text-cream" : "border-cream-line"
                            }`}
                          >
                            {on && <Icon name="check" className="h-3.5 w-3.5" />}
                          </span>
                          <span className="text-[14px] font-bold text-brand-deep">{t(`catering.size.${tr.id}` as Key)}</span>
                          <span className="mt-1 flex items-baseline gap-1.5">
                            <span className="font-display text-[40px] font-bold leading-none tabular-nums">{tr.pieces}</span>
                            <span className="text-[14px] font-bold">{t("catering.piecesShort")}</span>
                          </span>
                          <span className="mt-2 flex items-center gap-1.5 text-[14px] text-cocoa-soft">
                            <Icon name="users" className="h-4 w-4" /> {t("catering.serves", { n: tr.serves })}
                          </span>
                          <span className="absolute bottom-4 right-4 text-[19px] font-extrabold tabular-nums sm:static sm:mt-3 sm:border-t sm:border-cream-line sm:pt-3 sm:text-[17px]">${tr.from}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                {field("name", t("catering.form.name"), { autoComplete: "name" })}
                {field("phone", t("catering.form.phone"), { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "(704) 555-0123" })}
                {field("date", t("catering.form.date"), { type: "date", min: today })}
                {field("headcount", t("catering.form.headcount"), { type: "number", inputMode: "numeric", min: 1 })}
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
          <aside className="self-start rounded-3xl bg-cocoa p-6 text-cream sm:p-8">
            <p className="font-display text-[28px] font-bold leading-tight">{t("catering.prefer")}</p>
            <p className="mt-2 text-[16px] text-cream/85">{t("catering.preferBody")}</p>
            <a href={`tel:${site.phone.tel}`} className="mt-5 flex min-h-[44px] items-center gap-3 text-[20px] font-extrabold hover:underline">
              <Icon name="phone" className="h-5 w-5 text-brand-light" /> {site.phone.display}
            </a>
            <a href={`mailto:${site.email}`} className="flex min-h-[44px] items-center break-all text-[15px] font-semibold text-cream/90 hover:underline">
              {site.email}
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}
