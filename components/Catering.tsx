"use client";
import { useState } from "react";
import site from "@/data/site.json";
import { useApp } from "@/lib/lang";
import { Eyebrow, Icon, Photo } from "@/components/ui";
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
    <section id="catering" aria-labelledby="catering-title" className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-24">
      <Eyebrow>{t("catering.eyebrow")}</Eyebrow>
      <h2 id="catering-title" className="h2">
        {t("catering.title")}
      </h2>
      <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-cocoa-soft">{t("catering.body")}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Photo id="catering" alt={t("catering.photoAlt")} className="aspect-[4/3] w-full rounded-2xl" imgClassName="object-[center_62%]" />
        <ul className="grid gap-3 md:grid-rows-3">
          {site.catering.trays.map((tr) => (
            <li key={tr.id} className="flex flex-col justify-center rounded-2xl border-2 border-cream-line bg-white px-5 py-4">
              <p className="font-display text-[22px] font-semibold leading-tight">{t("catering.tray")}</p>
              <p className="mt-1 text-[16px] font-bold text-pink-deep">{t("catering.line", { n: tr.pieces, price: tr.from })}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
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
        <aside className="self-start rounded-3xl bg-cream-deep p-6 sm:p-8">
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
    </section>
  );
}
