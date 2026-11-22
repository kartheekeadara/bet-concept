"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import site from "@/data/site.json";
import { findItem } from "@/lib/menu";
import { useApp } from "@/lib/lang";
import { asset } from "@/lib/asset";
import { HOURS, fmtTime, nowInBakeryTz, openStatus, type OpenStatus } from "@/lib/hours";
import type { Key } from "@/data/i18n";
import { Icon, Photo, PriceTag, price } from "@/components/ui";
import { Logo } from "@/components/Header";
import { dayInSentence } from "@/components/Menu";

export const digits = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

/* ───────────────────────── HERO ───────────────────────── */
export function Hero() {
  const { t, lang, photos } = useApp();
  const hero = photos.slots.hero;
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-cocoa text-cream">
      {hero.src ? (
        // phones: shift right so the red "Bem-vindo!" mural stays in frame
        <img src={asset(hero.src)} alt={t("hero.photoAlt")} className="absolute inset-0 -z-10 h-full w-full object-cover object-[66%_50%] lg:object-center" />
      ) : (
        <div className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(135deg,#4A2C20_0_14px,#43271c_14px_28px)]">
          <span className="absolute right-4 top-4 max-w-[60%] rounded-md border-2 border-dashed border-cream/40 px-3 py-2 text-right text-[12px] font-semibold leading-snug text-cream/85">
            <span className="block uppercase tracking-[0.12em]">{t("photoNeeded")}</span>
            {hero.need}
          </span>
        </div>
      )}
      {/* bottom-left gradient keeps the headline AA over the bright photo; the top-right of the photo stays clear */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(44,24,15,0.95)_0%,rgba(44,24,15,0.82)_40%,rgba(44,24,15,0.15)_68%,rgba(44,24,15,0)_100%)] lg:bg-[linear-gradient(to_top_right,rgba(44,24,15,0.95)_0%,rgba(44,24,15,0.85)_34%,rgba(44,24,15,0.3)_56%,rgba(44,24,15,0)_74%)]"
      />

      <div className="mx-auto flex min-h-[min(80svh,720px)] max-w-page flex-col justify-end px-4 pb-10 pt-32 sm:px-6 sm:pb-16 lg:min-h-[min(86vh,780px)]">
        <h1 id="hero-title" lang="pt-BR" className="font-display text-[72px] font-bold leading-[0.88] sm:text-[112px] lg:text-[148px]">
          {t("hero.title")}
        </h1>
        <p className="mt-4 max-w-xl font-accent text-[22px] italic leading-snug text-cream sm:text-[28px]">{t("hero.sub")}</p>
        <a
          href={site.address.mapsUrl}
          target="_blank"
          rel="noopener"
          className="mt-7 inline-flex w-fit items-center gap-2.5 rounded-full bg-cocoa-deep/55 py-2 pl-3 pr-4 text-[15px] ring-1 ring-cream/25 backdrop-blur transition-colors hover:bg-cocoa-deep/80"
        >
          <span aria-hidden className="flex text-brand-light">
            {[0, 1, 2, 3, 4].map((i) => (
              <Icon key={i} name="star" className="h-4 w-4" />
            ))}
          </span>
          <span>
            <b className="font-extrabold">{lang === "pt" ? String(site.google.rating).replace(".", ",") : site.google.rating}</b>{" "}
            · {t("hero.reviews", { n: site.google.reviews })}
          </span>
        </a>
      </div>

    </section>
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
    <section aria-labelledby="must-title" className="py-16 sm:py-24">
      <div className="mx-auto max-w-page px-4 sm:px-6">
        <h2 id="must-title" className="h2">
          {t("must.title")}
        </h2>
        <p className="mt-3 max-w-md text-[17px] text-cocoa-soft">{t("must.intro")}</p>
      </div>

      {/* phones: swipeable row (snaps, peeks the next card); desktop: 4-up grid */}
      <ol className="no-scrollbar mx-auto mt-8 flex [contain:paint] max-w-page snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:scroll-px-6 sm:px-6 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible">
        {MUST.map((m) => {
          const item = findItem(m.id);
          return (
            <li key={m.id} className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-auto">
              <article className="group">
                <div className="relative">
                  <Photo id={m.id} alt={`${item.pt}: ${item.en}`} className="aspect-[4/5] w-full rounded-3xl" imgClassName="transition-transform duration-500 group-hover:scale-[1.03]" />
                  {item.price != null && (
                    <PriceTag amount={item.price} unit={item.unitKey ? t(item.unitKey as Key) : undefined} className="absolute bottom-3 left-3 rotate-[-3deg]" />
                  )}
                </div>
                <h3 lang="pt-BR" className="mt-4 font-display text-[28px] font-bold leading-tight">
                  {item.pt}
                </h3>
                <p className="mt-0.5 text-[15px] text-brand-deep">
                  <span className="sr-only">{t("must.say")}: </span>
                  <span className="font-bold italic tracking-wide">{m.say}</span>
                </p>
                <p lang="en" className="mt-2 text-[16px] leading-snug text-cocoa-soft">
                  {item.en}
                </p>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ───────────────────────── MARCIA'S STORY ───────────────────────── */
export function Story() {
  const { t } = useApp();
  return (
    <section aria-labelledby="story-title" className="bg-cream-deep">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-16">
        {/* the chalkboard wall in the dining room: "so glad you're here" */}
        <Photo id="chalkboard" alt={t("story.photoAlt")} className="aspect-[4/3] w-full rounded-3xl md:aspect-[4/5]" />
        <div>
          <h2 id="story-title" className="h2">
            {t("story.title")}
          </h2>
          <div className="mt-6 space-y-4 text-[18px] leading-relaxed">
            <p>{t("story.p1")}</p>
            <p>{t("story.p2")}</p>
            <p>{t("story.p3")}</p>
          </div>
          <p className="mt-6 font-accent text-[30px] font-semibold italic text-brand">{t("story.sign")}</p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FEIJOADA SATURDAY ───────────────────────── */
export function Feijoada() {
  const { t, lang } = useApp();
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
    <section id="feijoada" aria-labelledby="feijoada-title" className="scroll-mt-20 bg-cocoa text-cream">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-cream/10 px-3 py-1 text-[13px] font-extrabold uppercase tracking-[0.14em] text-brand-light">
            <Icon name="clock" className="h-4 w-4" /> {t("feijoada.kicker")}
          </p>
          <h2 id="feijoada-title" lang="pt-BR" className="mt-5 font-display text-[56px] font-bold leading-[0.9] sm:text-[84px]">
            {t("feijoada.title")}
          </h2>
          <p className="mt-5 max-w-lg text-[18px] leading-relaxed text-cream/90">{t("feijoada.body")}</p>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-cream/15 py-5">
            <div>
              <dt className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-cream/70">{t("feijoada.next")}</dt>
              <dd className="mt-1 font-display text-[30px] font-bold leading-none">{site.feijoada.nextDate[lang]}</dd>
            </div>
            <div>
              <dt className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-cream/70">{t("feijoada.priceLabel")}</dt>
              <dd className="mt-1 font-display text-[30px] font-bold leading-none tabular-nums">
                {price(site.feijoada.price)}
                <span className="ml-1.5 font-sans text-[15px] font-semibold text-cream/80">/ {t("menu.unit.plate")}</span>
              </dd>
            </div>
          </dl>

          {done ? (
            <p role="status" className="mt-6 flex items-center gap-2 rounded-xl bg-cream/10 p-4 text-[17px] font-bold">
              <Icon name="check" className="h-6 w-6 text-brand-light" /> {t("feijoada.done")}
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
                  aria-describedby={err ? "feijoada-err" : "feijoada-hint"}
                  className="field border-transparent sm:max-w-xs"
                />
                <button type="submit" className="btn bg-brand-light text-cocoa hover:bg-white">
                  {t("feijoada.submit")}
                </button>
              </div>
              {err ? (
                <p id="feijoada-err" className="mt-2 text-[14px] font-bold text-brand-light">
                  {err}
                </p>
              ) : (
                <p id="feijoada-hint" className="mt-2 text-[14px] text-cream/75">
                  {t("feijoada.hint")}
                </p>
              )}
            </form>
          )}
        </div>

        <Photo id="feijoada" alt={t("feijoada.photoAlt")} className="aspect-square w-full rounded-3xl" />
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
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[12px] ${dark ? "bg-brand-light text-cocoa" : "bg-brand text-white"}`}>
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

/** Live "Open until 7 PM" / "Closed · opens Tuesday 8 AM". Computed after mount so the static HTML never shows a stale state. */
export function OpenNow({ className = "" }: { className?: string }) {
  const { t, lang } = useApp();
  const [s, setS] = useState<OpenStatus | null>(null);
  useEffect(() => {
    const tick = () => setS(openStatus());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  if (!s) return <p className={`invisible ${className}`} aria-hidden>&nbsp;</p>;
  const open = s.kind === "open";
  const label =
    s.kind === "open"
      ? t("hours.openUntil", { time: fmtTime(s.until, lang) })
      : s.kind === "later"
        ? t("hours.opensToday", { time: fmtTime(s.at, lang) })
        : t("hours.opensOn", { day: dayInSentence(t(`day.${s.day}` as Key), lang), time: fmtTime(s.at, lang) });
  return (
    <p className={`flex items-center gap-2.5 ${className}`}>
      <span aria-hidden className={`relative flex h-3 w-3 shrink-0 rounded-full ${open ? "bg-open" : "bg-cocoa-soft/50"}`}>
        {open && <span className="absolute inset-0 animate-ping rounded-full bg-open/60 motion-reduce:hidden" />}
      </span>
      {label}
    </p>
  );
}

export function Visit() {
  const { t } = useApp();
  return (
    <section id="visit" aria-labelledby="visit-title" className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-16">
        <div>
          <h2 id="visit-title" className="h2 max-w-[16ch] sm:text-[56px]">
            {t("visit.title")}
          </h2>
          <p className="mt-3 font-accent text-[22px] italic text-cocoa-soft">{t("visit.sub")}</p>

          <OpenNow className="mt-8 text-[20px] font-extrabold" />

          <a href={site.address.mapsUrl} target="_blank" rel="noopener" className="group mt-4 block w-fit">
            <span className="block font-display text-[28px] font-semibold leading-tight group-hover:underline sm:text-[32px]">
              {site.address.street}
            </span>
            <span className="mt-1 block text-[17px] text-cocoa-soft">
              {site.address.city}, {site.address.region} {site.address.postal} · {site.address.neighborhood}
            </span>          </a>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:max-w-lg">
            <a href={site.address.directionsUrl} target="_blank" rel="noopener" className="btn-primary">
              <Icon name="pin" /> {t("visit.directions")}
            </a>
            <a href={`tel:${site.phone.tel}`} className="btn-ghost">
              <Icon name="phone" /> {site.phone.display}
            </a>
          </div>

          <div className="mt-10 max-w-lg">
            <HoursTable />
          </div>
        </div>

        {/* native portrait ratio so the sign over the door stays in frame */}
        <a href={site.address.mapsUrl} target="_blank" rel="noopener" tabIndex={-1} aria-hidden className="block">
          <Photo id="storefront" alt="" className="aspect-[3/4] w-full rounded-3xl" imgClassName="object-[center_40%]" />
        </a>
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
        </div>
        <nav aria-label={t("footer.links")}>
          <h2 className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-brand-light">{t("footer.links")}</h2>
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
          <h2 className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-brand-light">{t("footer.follow")}</h2>
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
