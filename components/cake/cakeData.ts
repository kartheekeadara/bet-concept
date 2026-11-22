import site from "@/data/site.json";
import { HOURS } from "@/lib/hours";
import { translate, type Key, type Lang } from "@/data/i18n";
import { GALLERY, galleryById } from "@/components/cake/gallery";

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
  /** "scratch" or a gallery cake id (components/cake/gallery.ts) */
  start: string;
  occasion: string;
  /** guest count typed into the size helper (kept so the suggestion survives a refresh) */
  guests: string;
  size: string;
  flavor: string;
  filling: string;
  /** design style id, set by the gallery cake they start from; optional */
  style: string;
  addons: string[];
  message: string;
  lettering: "script" | "print";
  placement: "top" | "side";
  /** color-idea chip ids (site.json colorIdeas) */
  colorIds: string[];
  /** free text: "Other design details" */
  colors: string;
  /** dietary ids (DIETARY) + free text for "other" */
  dietary: string[];
  dietaryOther: string;
  /** docinhos box id (site.json docinhos), "" = none */
  docinhos: string;
  /** tiered quote budget chip (BUDGETS), "" = not given */
  budget: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  name: string;
  phone: string;
  email: string;
  notes: string;
};

export const EMPTY: CakeState = {
  start: "",
  occasion: "",
  guests: "",
  size: "",
  flavor: "",
  filling: "",
  style: "",
  addons: [],
  message: "",
  lettering: "script",
  placement: "side",
  colorIds: [],
  colors: "",
  dietary: [],
  dietaryOther: "",
  docinhos: "",
  budget: "",
  date: "",
  time: "",
  name: "",
  phone: "",
  email: "",
  notes: "",
};

/** Nothing picked yet (the occasion doesn't count): the preview shows an empty plate. */
export const isIdleCake = (s: CakeState) =>
  !s.start && !s.size && !s.flavor && !s.filling && !s.style && !s.message.trim() && !s.addons.length && !s.colorIds.length;

export const sizeById = (id: string) => CAKES.sizes.find((s) => s.id === id);
export const flavorById = (id: string) => CAKES.flavors.find((s) => s.id === id);
export const fillingById = (id: string) => CAKES.fillings.find((s) => s.id === id);

/** Smallest size that feeds this many guests (serving ranges in site.json). */
export function sizeForGuests(n: number) {
  if (!n || n < 1) return "";
  if (n <= 10) return "6in";
  if (n <= 20) return "8in";
  if (n <= 30) return "10in";
  return "tiered";
}

export const DIETARY = ["nutFree", "noAlcohol", "other"] as const;
export const BUDGETS = ["under200", "200to400", "over400"] as const;
export const docinhoBox = (id: string) => CAKES.docinhos.boxes.find((b) => b.id === id);
/** Tiered cakes skip the deposit: Marcia texts a quote instead. */
export const isQuote = (s: Pick<CakeState, "size">) => {
  const size = sizeById(s.size);
  return !!size && size.from == null;
};

/**
 * Apply a Start choice. A gallery cake pre-fills its style, colors and extras; whatever the previous
 * gallery cake had added is taken back out, so the customer's own picks survive a change of mind.
 */
export function applyStart(prev: CakeState, id: string): CakeState {
  if (prev.start === id) return prev;
  const from = galleryById(prev.start);
  const to = galleryById(id);
  const swap = (cur: string[], out: string[] = [], add: string[] = []) => [...new Set([...cur.filter((x) => !out.includes(x)), ...add])];
  return {
    ...prev,
    start: id,
    style: to ? to.style : prev.style === from?.style ? "" : prev.style,
    colorIds: swap(prev.colorIds, from?.colors, to?.colors),
    addons: swap(prev.addons, from?.addons, to?.addons),
  };
}

/** Older drafts kept color chips as text in `colors`: move them into colorIds. */
export function normalizeDraft(saved: Partial<CakeState>): CakeState {
  const s: CakeState = { ...EMPTY, ...saved };
  if (saved.colorIds) return s;
  const labels = (["en", "pt"] as const).flatMap((l) => CAKES.colorIdeas.map((c) => [c, translate(l, `cake.color.${c}` as Key)] as const));
  const parts = s.colors.split(",").map((x) => x.trim()).filter(Boolean);
  const ids = parts.flatMap((p) => labels.filter(([, label]) => label === p).map(([c]) => c));
  return { ...s, colorIds: [...new Set(ids)], colors: parts.filter((p) => !labels.some(([, label]) => label === p)).join(", ") };
}

/* ── share links: the design only. Name, phone, email and notes never go in the URL. ── */
export function encodeShare(s: CakeState) {
  const full: Record<string, unknown> = {
    st: s.start, oc: s.occasion, g: s.guests, z: s.size, f: s.flavor, i: s.filling, y: s.style, a: s.addons,
    m: s.message, l: s.lettering === "print" ? "print" : "", p: s.placement === "top" ? "top" : "",
    c: s.colorIds, x: s.colors, d: s.dietary, o: s.dietaryOther, b: s.docinhos, u: s.budget, dt: s.date, t: s.time,
  };
  const compact = Object.fromEntries(Object.entries(full).filter(([, v]) => (Array.isArray(v) ? v.length : v)));
  let bin = "";
  new TextEncoder().encode(JSON.stringify(compact)).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Reads `#cake=…`. The URL is untrusted: every field is checked against the real options. */
export function decodeShare(hash: string): CakeState | null {
  const m = hash.match(/^#cake=([\w-]+)$/);
  if (!m) return null;
  try {
    const b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const o = JSON.parse(new TextDecoder().decode(bytes));
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const one = (v: unknown, ok: readonly string[]) => (typeof v === "string" && ok.includes(v) ? v : "");
    const many = (v: unknown, ok: readonly string[]) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && ok.includes(x)))] : []);
    const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
    const size = one(o.z, CAKES.sizes.map((x) => x.id));
    const rawDate = typeof o.dt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.dt) ? o.dt : "";
    const date = rawDate && isDateAllowed(rawDate, size) ? rawDate : "";
    return {
      ...EMPTY,
      start: one(o.st, ["scratch", ...GALLERY.map((g) => g.id)]) || "scratch",
      occasion: one(o.oc, OCCASIONS.map((x) => x.id)),
      guests: text(o.g, 3).replace(/\D/g, ""),
      size,
      flavor: one(o.f, CAKES.flavors.map((x) => x.id)),
      filling: one(o.i, CAKES.fillings.map((x) => x.id)),
      style: one(o.y, Object.keys(CAKES.styles)),
      addons: many(o.a, CAKES.addons.map((x) => x.id)),
      message: text(o.m, 40),
      lettering: o.l === "print" ? "print" : "script",
      placement: o.p === "top" ? "top" : "side",
      colorIds: many(o.c, CAKES.colorIdeas),
      colors: text(o.x, 300),
      dietary: many(o.d, DIETARY),
      dietaryOther: text(o.o, 80),
      docinhos: one(o.b, CAKES.docinhos.boxes.map((x) => x.id)),
      budget: one(o.u, BUDGETS),
      date,
      time: date ? one(o.t, slotsFor(date)) : "",
    };
  } catch {
    return null;
  }
}

export type PriceLine = { kind: "base" | "flavor" | "filling" | "style" | "addon" | "docinhos"; id: string; amount: number };
const STYLE_PRICES = CAKES.styles as Record<string, number>;
export const stylePrice = (id: string) => STYLE_PRICES[id] ?? 0;
export const addonById = (id: string) => CAKES.addons.find((a) => a.id === id);

/**
 * Live estimate (mockup prices). null = no size yet; "quote" = tiered, Marcia quotes by hand.
 * Lines only include things that change the price, so the breakdown stays short.
 */
export function estimate(s: CakeState): { total: number; lines: PriceLine[] } | "quote" | null {
  const size = sizeById(s.size);
  if (!size) return null;
  if (size.from == null) return "quote";
  const lines: PriceLine[] = [{ kind: "base", id: size.id, amount: size.from }];
  const fl = flavorById(s.flavor);
  if (fl?.premium) lines.push({ kind: "flavor", id: fl.id, amount: fl.premium });
  const fi = fillingById(s.filling);
  if (fi?.premium) lines.push({ kind: "filling", id: fi.id, amount: fi.premium });
  if (s.style && stylePrice(s.style)) lines.push({ kind: "style", id: s.style, amount: stylePrice(s.style) });
  for (const id of s.addons) {
    const a = addonById(id);
    if (a) lines.push({ kind: "addon", id, amount: a.price });
  }
  const box = docinhoBox(s.docinhos);
  if (box) lines.push({ kind: "docinhos", id: box.id, amount: box.price });
  return { total: lines.reduce((n, l) => n + l.amount, 0), lines };
}

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

export const isHoliday = (ymd: string) => CAKES.closedDates.includes(ymd);
export const isLimitedDate = (ymd: string) => CAKES.limitedDates.includes(ymd);
/** Open for pickup: not a weekly closed day (Mondays) and not a holiday in site.json. */
export const isOpenDay = (ymd: string) => !!HOURS[weekday(ymd)] && !isHoliday(ymd);

/** First pickup date allowed for this size: today + lead time, skipping closed days. */
export function earliestDate(sizeId: string) {
  let d = addDays(todayYMD(), leadDaysFor(sizeId || "6in"));
  while (!isOpenDay(d)) d = addDays(d, 1);
  return d;
}

export function isDateAllowed(ymd: string, sizeId: string) {
  if (!ymd) return false;
  if (!isOpenDay(ymd)) return false;
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

/** One line for the phone strip, the homepage "continue" chip and the calendar file: "8″ round · Brigadeiro + Morango · Floral garden". */
export function summaryLine(s: CakeState, t: (k: Key, v?: Record<string, string | number>) => string) {
  const bits: string[] = [];
  if (s.size) bits.push(t(`cake.size.${s.size}` as Key));
  const fl = flavorById(s.flavor);
  const fi = fillingById(s.filling);
  if (fl || fi) bits.push([fl?.pt, fi?.pt].filter(Boolean).join(" + "));
  if (s.style) bits.push(t(`cake.style.${s.style}` as Key));
  if (!bits.length && galleryById(s.start)) bits.push(t(galleryById(s.start)!.key));
  return bits.join(" · ");
}
