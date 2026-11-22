import site from "@/data/site.json";
import type { Lang } from "@/data/i18n";

export type DayHours = { open: string; close: string } | null;
export const HOURS = site.hours.days as DayHours[];
const TZ = site.timezone;

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** "19:00" → "7 PM" (en) / "19h" (pt) */
export function fmtTime(hhmm: string, lang: Lang) {
  const [h, m] = hhmm.split(":").map(Number);
  if (lang === "pt") return `${h}h${m ? String(m).padStart(2, "0") : ""}`;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${suffix}`;
}

/** Day of week (0=Sun) and minutes since midnight, in the bakery's timezone. */
export function nowInBakeryTz(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpenStatus =
  | { kind: "open"; until: string }
  | { kind: "later"; at: string }
  | { kind: "closed"; day: number; at: string };

export function openStatus(d = new Date()): OpenStatus {
  const { day, minutes } = nowInBakeryTz(d);
  const today = HOURS[day];
  if (today) {
    if (minutes < toMin(today.open)) return { kind: "later", at: today.open };
    if (minutes < toMin(today.close)) return { kind: "open", until: today.close };
  }
  for (let i = 1; i <= 7; i++) {
    const nd = (day + i) % 7;
    const h = HOURS[nd];
    if (h) return { kind: "closed", day: nd, at: h.open };
  }
  return { kind: "closed", day, at: "00:00" };
}
