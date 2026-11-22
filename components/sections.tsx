"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import site from "@/data/site.json";
import { findItem } from "@/lib/menu";
import { useApp } from "@/lib/lang";
import { asset } from "@/lib/asset";
import { HOURS, fmtTime, nowInBakeryTz } from "@/lib/hours";
import type { Key } from "@/data/i18n";
import { Eyebrow, Icon, OpenChip, Photo, SampleTag, price } from "@/components/ui";
import { Logo } from "@/components/Header";

export const digits = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

/* ───────────────────────── HERO ───────────────────────── */
export function Hero() {
  const { t, photos } = useApp();
  const hero = photos.slots.hero;
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-cocoa text-cream">
      {hero.src ? (
        <img src={asset(hero.src)} alt={t("hero.photoAlt")} className="absolute inset-0 -z-10 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(135deg,#4A2C20_0_14px,#43271c_14px_28px)]">
          <span className="absolute right-4 top-4 max-w-[60%] rounded-md border-2 border-dashed border-cream/40 px-3 py-2 text-right text-[12px] font-semibold leading-snug text-cream/85">
            <span className="block uppercase tracking-[0.12em]">{t("photoNeeded")}</span>
            {hero.need}
          </span>
        </div>
      )}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-cocoa-deep/90 via-cocoa-deep/45 to-cocoa-deep/10" />

      <div className="mx-auto flex min-h-[min(80svh,720px)] max-w-page flex-col justify-end px-4 pb-10 pt-32 sm:px-6 sm:pb-16 lg:min-h-[min(86vh,780px)]">
        <h1 id="hero-title" lang="pt-BR" className="font-display text-[64px] font-semibold leading-[0.92] tracking-[-0.02em] sm:text-[96px] lg:text-[120px]">
          {t("hero.title")}
        </h1>
        <p className="mt-4 max-w-xl font-display text-[22px] italic leading-snug text-cream sm:text-[28px]">{t("hero.sub")}</p>
        <p className="mt-3 max-w-lg text-[17px] leading-relaxed text-cream/90">{t("hero.body")}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/order-cake" className="btn-primary">
            {t("cta.orderCake")}
          </Link>
          <Link href="#menu" className="btn-ghost-light">
            {t("cta.seeMenu")}
          </Link>
        </div>
      </div>

      {/* Savor-style floating preorder card, desktop only (mobile has the sticky bottom bar) */}
      <Link
        href="/order-cake"
        className="group absolute bottom-8 right-6 hidden w-[300px] items-center gap-3 rounded-2xl bg-cream p-2.5 pr-4 text-cocoa shadow-[0_18px_50px_-12px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5 lg:flex xl:right-[max(1.5rem,calc((100vw-1200px)/2))]"
      >
        <Photo id="cake-1" alt={t("hero.card.alt")} className="h-[84px] w-[84px] shrink-0 rounded-xl text-[0px]" />
        <span>
          <span className="block font-display text-[19px] font-semibold leading-tight">{t("hero.card.title")}</span>
          <span className="mt-1 block text-[15px] font-bold text-pink group-hover:underline">{t("hero.card.cta")}</span>
        </span>
      </Link>
    </section>
  );
}

/* ───────────────────────── TODAY STRIP ───────────────────────── */
export function focusFeijoada() {
  window.setTimeout(() => document.getElementById("feijoada-phone")?.focus({ preventScroll: true }), 450);
}

export function TodayStrip() {
  const { t, lang } = useApp();
  return (
    <div className="border-b border-cream-line bg-pink-wash">
      <div className="mx-auto flex max-w-page flex-col gap-1 px-4 py-2.5 text-[15px] font-semibold sm:flex-row sm:items-center sm:justify-center sm:gap-6 sm:px-6">
        <span className="flex min-h-[32px] items-center gap-2">
          <Icon name="clock" className="h-4 w-4 text-pink" /> {t("today.lunch")}
        </span>
        <span aria-hidden className="hidden text-cocoa-soft sm:inline">
          ·
        </span>
        <span className="flex flex-wrap items-center gap-x-2">
          <span>{t("today.feijoada", { date: site.feijoada.nextDate[lang] })}</span>
          <a href="#feijoada" onClick={focusFeijoada} className="inline-flex min-h-[44px] items-center font-extrabold text-pink-deep underline underline-offset-4">
            {t("today.textMe")} →
          </a>
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────── FIRST TIME HERE ───────────────────────── */
const MUST = [
  { id: "coxinha", say: "coh-SHEE-nyah" },
  { id: "pao-de-queijo", say: "pow-djee-KAY-zhoo" },
  { id: "pastel", say: "pahs-TEH-oo" },
  { id: "brigadeiro", say: "bree-gah-DAY-roo" },
];

export function MustTry() {
  const { t } = useApp();
  return (
    <section aria-labelledby="must-title" className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-24">
      <Eyebrow>{t("must.eyebrow")}</Eyebrow>
      <h2 id="must-title" className="h2">
        {t("must.title")}
      </h2>
      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {MUST.map((m) => {
          const item = findItem(m.id);
          return (
            <li key={m.id} className="flex gap-4 rounded-2xl bg-white p-3 shadow-[0_1px_0_#E6D5BE] sm:flex-col sm:p-0 sm:pb-5">
              <Photo
                id={m.id}
                alt={`${item.pt}: ${item.en}`}
                className="aspect-square w-[112px] shrink-0 rounded-xl text-[11px] sm:w-full sm:rounded-b-none sm:rounded-t-2xl"
              />
              <div className="min-w-0 sm:px-5">
                <h3 lang="pt-BR" className="font-display text-[24px] font-semibold leading-tight">
                  {item.pt}
                </h3>
                <p className="text-[14px] text-cocoa-soft">
                  <span className="sr-only">{t("must.say")}: </span>
                  <span className="font-semibold italic tracking-wide">{m.say}</span>
                </p>
                <p className="mt-2 text-[15px] leading-snug">{item.en}</p>
                <p className="mt-2 text-[16px] font-extrabold">{item.price != null ? price(item.price) : t("menu.ask")}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ───────────────────────── MARCIA'S STORY ───────────────────────── */
export function Story() {
  const { t } = useApp();
  return (
    <section aria-labelledby="story-title" className="bg-cream-deep">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-16">
        <Photo id="marcia" alt={t("story.photoAlt")} className="aspect-[4/5] w-full rounded-3xl" />
        <div>
          <Eyebrow>{t("story.eyebrow")}</Eyebrow>
          <h2 id="story-title" className="h2">
            {t("story.title")}
          </h2>
          <div className="mt-6 space-y-4 text-[18px] leading-relaxed">
            <p>{t("story.p1")}</p>
            <p>{t("story.p2")}</p>
            <p>{t("story.p3")}</p>
          </div>
          <p className="mt-6 font-display text-[30px] font-semibold italic text-pink">{t("story.sign")}</p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FEIJOADA SIGNUP + LOYALTY ───────────────────────── */
export function FeijoadaAndLoyalty() {
  const { t } = useApp();
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (digits(phone).length !== 10) return setErr(t("form.phone"));
    setErr("");
    // Mock: the live version would add the number to an SMS list (e.g. Twilio / SimpleTexting) with opt-in consent.
    setDone(true);
  };

  return (
    <section aria-label={`${t("feijoada.eyebrow")} · ${t("loyalty.title")}`} className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div id="feijoada" className="scroll-mt-24 rounded-3xl bg-cocoa p-6 text-cream sm:p-10">
          <Eyebrow dark>{t("feijoada.eyebrow")}</Eyebrow>
          <h2 className="font-display text-[30px] font-semibold leading-tight sm:text-[38px]">{t("feijoada.title")}</h2>
          <p className="mt-2 text-[17px] text-cream/90">{t("feijoada.body")}</p>
          {done ? (
            <p role="status" className="mt-6 flex items-center gap-2 rounded-xl bg-cream/10 p-4 text-[17px] font-bold">
              <Icon name="check" className="h-6 w-6 text-pink-light" /> {t("feijoada.done")}
            </p>
          ) : (
            <form onSubmit={submit} noValidate className="mt-6">
              <label htmlFor="feijoada-phone" className="mb-1.5 block text-[15px] font-bold">
                {t("feijoada.label")}
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="feijoada-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(704) 555-0123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={!!err}
                  aria-describedby={err ? "feijoada-err" : undefined}
                  className="field border-transparent sm:max-w-xs"
                />
                <button type="submit" className="btn bg-pink-light text-cocoa hover:bg-white">
                  {t("feijoada.submit")}
                </button>
              </div>
              {err && (
                <p id="feijoada-err" className="mt-2 text-[14px] font-bold text-pink-light">
                  {err}
                </p>
              )}
            </form>
          )}
        </div>

        <div className="relative rounded-3xl border-2 border-dashed border-cream-line bg-white p-6 sm:p-8">
          <span className="absolute right-5 top-5 rounded-full bg-pink-wash px-3 py-1 text-[12px] font-extrabold uppercase tracking-wider text-pink-deep">
            {t("loyalty.soon")}
          </span>
          <h2 className="font-display text-[28px] font-semibold leading-tight">{t("loyalty.title")}</h2>
          <p className="text-[17px] text-cocoa-soft">{t("loyalty.body")}</p>
          <ol className="mt-6 grid grid-cols-5 gap-2.5" aria-label={t("loyalty.title")}>
            {Array.from({ length: 10 }, (_, i) => {
              const filled = i < 3;
              const last = i === 9;
              return (
                <li
                  key={i}
                  aria-label={last ? t("loyalty.free") : t("loyalty.stamp", { n: i + 1 })}
                  className={`flex aspect-square items-center justify-center rounded-full text-[15px] font-extrabold ${
                    filled ? "bg-pink text-white" : last ? "border-2 border-pink bg-pink-wash text-pink-deep" : "border-2 border-dashed border-cream-line text-cocoa-soft"
                  }`}
                >
                  {last ? <Icon name="gift" className="h-5 w-5" /> : filled ? <Icon name="check" className="h-5 w-5" /> : i + 1}
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-right text-[13px] font-bold text-cocoa-soft">3 / 10</p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── VISIT ───────────────────────── */
export function HoursTable({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const { t, lang } = useApp();
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(nowInBakeryTz().day), []);
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <table className={`w-full ${compact ? "text-[15px]" : "text-[17px]"}`}>
      <caption className="sr-only">{t("visit.hours")}</caption>
      <tbody>
        {order.map((d) => {
          const h = HOURS[d];
          const isToday = d === today;
          return (
            <tr
              key={d}
              className={`${compact ? "" : "border-b"} ${dark ? "border-cream/15" : "border-cream-line"} ${isToday ? "font-extrabold" : ""}`}
            >
              <th scope="row" className={`text-left font-[inherit] ${compact ? "py-0.5" : "py-2.5"}`}>
                {t(`day.${d}` as Key)}
                {isToday && !compact && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[12px] ${dark ? "bg-pink-light text-cocoa" : "bg-pink text-white"}`}>
                    {t("hours.today")}
                  </span>
                )}
              </th>
              <td className="text-right tabular-nums">{h ? `${fmtTime(h.open, lang)} – ${fmtTime(h.close, lang)}` : t("hours.closed")}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function Visit() {
  const { t } = useApp();
  return (
    <section id="visit" aria-labelledby="visit-title" className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-24">
      <Eyebrow>{t("visit.eyebrow")}</Eyebrow>
      <h2 id="visit-title" className="h2">
        {t("visit.title")}
      </h2>
      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <OpenChip />
            <SampleTag className="text-cocoa-soft" />
          </div>
          <h3 className="mt-5 text-[15px] font-extrabold uppercase tracking-[0.14em] text-cocoa-soft">{t("visit.hours")}</h3>
          <div className="mt-2">
            <HoursTable />
          </div>
        </div>
        <div>
          <a href={site.address.mapsUrl} target="_blank" rel="noopener" className="group block">
            <Photo id="storefront" alt={`${site.name}, ${site.address.street}`} className="aspect-[16/9] w-full rounded-2xl" />
            <span className="mt-4 flex items-start gap-3">
              <Icon name="pin" className="mt-1 h-6 w-6 shrink-0 text-pink" />
              <span className="text-[18px] leading-snug">
                <span className="block font-extrabold group-hover:underline">{site.address.street}</span>
                {site.address.city}, {site.address.region} {site.address.postal}
                <span className="block text-[15px] text-cocoa-soft">{site.address.neighborhood}</span>
              </span>
            </span>
          </a>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a href={site.address.directionsUrl} target="_blank" rel="noopener" className="btn-primary">
              <Icon name="pin" /> {t("visit.directions")}
            </a>
            <a href={`tel:${site.phone.tel}`} className="btn-ghost">
              <Icon name="phone" /> {t("visit.call", { phone: site.phone.display })}
            </a>
            <a href={site.instagram.url} target="_blank" rel="noopener" className="btn-ghost sm:col-span-2">
              <Icon name="ig" /> {site.instagram.handle}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FOOTER ───────────────────────── */
export function Footer() {
  const { t } = useApp();
  return (
    <footer className="bg-cocoa-deep pb-28 text-cream lg:pb-0">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo dark />
          <p className="mt-4 text-[16px] leading-relaxed text-cream/85">
            {site.address.street}
            <br />
            {site.address.city}, {site.address.region} {site.address.postal}
            <br />
            <a href={`tel:${site.phone.tel}`} className="inline-flex min-h-[44px] items-center underline underline-offset-4">
              {site.phone.display}
            </a>
          </p>
          <div className="mt-4 max-w-[260px] text-cream/90">
            <HoursTable dark compact />
          </div>
        </div>
        <nav aria-label={t("footer.links")}>
          <h2 className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-pink-light">{t("footer.links")}</h2>
          <ul className="mt-3">
            {(
              [
                ["/#menu", "nav.menu"],
                ["/#cakes", "nav.cakes"],
                ["/order-cake", "cta.orderCake"],
                ["/#catering", "nav.catering"],
                ["/#visit", "nav.visit"],
              ] as const
            ).map(([href, key]) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-[44px] items-center text-[17px] hover:underline">
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-pink-light">{t("footer.follow")}</h2>
          <ul className="mt-3">
            <li>
              <a href={site.instagram.url} target="_blank" rel="noopener" className="inline-flex min-h-[44px] items-center gap-2 text-[17px] hover:underline">
                <Icon name="ig" /> {site.instagram.handle}
              </a>
            </li>
            <li>
              <a href={site.facebook.url} target="_blank" rel="noopener" className="inline-flex min-h-[44px] items-center gap-2 text-[17px] hover:underline">
                <Icon name="fb" /> {t("footer.facebook")}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex min-h-[44px] items-center break-all text-[15px] hover:underline">
                {site.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/15">
        <p className="mx-auto max-w-page px-4 py-5 text-[14px] text-cream/80 sm:px-6">
          © {new Date().getFullYear()} {site.name} · <span lang="en">{t("footer.disclaimer")}</span>
        </p>
      </div>
    </footer>
  );
}
