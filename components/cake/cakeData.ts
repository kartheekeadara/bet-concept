import site from "@/data/site.json";
import { HOURS } from "@/lib/hours";
import type { Lang } from "@/data/i18n";

export const CAKES = site.cakes;
export type Size = (typeof CAKES.sizes)[number];

export const OCCASIONS = [
  { id: "birthday", key: "cake.occ.birthday" },
  { id: "wedding", key: "cake.occ.wedding" },
  { id: "baby", key: "cake.occ.baby" },
  { id: "graduation", key: "cake.occ.graduation" },
  { id: "just", key: "cake.occ.just" },
] as const;

export type CakeState = {
  occasion: string;
  size: string;
  flavor: string;
  filling: string;
  message: string;
  colors: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  name: string;
  phone: string;
  email: string;
  notes: string;
};

export const EMPTY: CakeState = {
  occasion: "",
  size: "",
  flavor: "",
  filling: "",
  message: "",
  colors: "",
  date: "",
  time: "",
  name: "",
  phone: "",
  email: "",
  notes: "",
};

export const sizeById = (id: string) => CAKES.sizes.find((s) => s.id === id);
export const flavorById = (id: string) => CAKES.flavors.find((s) => s.id === id);
export const fillingById = (id: string) => CAKES.fillings.find((s) => s.id === id);

export const leadDaysFor = (sizeId: string) =>
  sizeById(sizeId)?.tiers && sizeById(sizeId)!.tiers > 1 ? CAKES.leadDays.tiered : CAKES.leadDays.standard;

/* ── dates are handled as plain Y-M-D strings in the bakery's timezone ── */
export function todayYMD() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: site.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return p; // en-CA gives YYYY-MM-DD
}
export const ymdToDate = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};
export const dateToYMD = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (ymd: string, n: number) => {
  const d = ymdToDate(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return dateToYMD(d);
};
export const weekday = (ymd: string) => ymdToDate(ymd).getUTCDay();

/** First pickup date allowed for this size: today + lead time, skipping closed days. */
export function earliestDate(sizeId: string) {
  let d = addDays(todayYMD(), leadDaysFor(sizeId || "6in"));
  while (!HOURS[weekday(d)]) d = addDays(d, 1);
  return d;
}

export function isDateAllowed(ymd: string, sizeId: string) {
  if (!ymd) return false;
  if (!HOURS[weekday(ymd)]) return false; // Mondays (closed)
  return ymd >= earliestDate(sizeId);
}

/** Hourly pickup slots from one hour after opening to one hour before closing. */
export function slotsFor(ymd: string) {
  const h = HOURS[weekday(ymd)];
  if (!h) return [];
  const open = Number(h.open.split(":")[0]);
  const close = Number(h.close.split(":")[0]);
  const out: string[] = [];
  for (let x = open + 1; x <= close - 1; x++) out.push(`${String(x).padStart(2, "0")}:00`);
  return out;
}

export const locale = (lang: Lang) => (lang === "pt" ? "pt-BR" : "en-US");
export function fmtDate(ymd: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }) {
  return new Intl.DateTimeFormat(locale(lang), { ...opts, timeZone: "UTC" }).format(ymdToDate(ymd));
}

export const phoneDigits = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
export const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
