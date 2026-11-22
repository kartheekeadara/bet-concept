"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/lang";
import { asset } from "@/lib/asset";
import { openStatus, fmtTime, type OpenStatus } from "@/lib/hours";
import type { Key } from "@/data/i18n";

/** Real photo if it exists in public/photos/real/, otherwise a neutral labeled placeholder. Never AI imagery. */
export function Photo({
  id,
  alt,
  className = "",
  imgClassName = "",
  eager = false,
}: {
  id: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}) {
  const { photos, t } = useApp();
  const slot = photos.slots[id];
  if (slot?.src) {
    return (
      <div className={`overflow-hidden bg-cream-deep ${className}`}>
        <img
          src={asset(slot.src)}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={`${t("photoNeeded")}: ${slot?.need ?? alt}`}
      className={`flex items-center justify-center border-2 border-dashed border-cocoa/25 bg-[repeating-linear-gradient(135deg,#F3E6D3_0_12px,#EFDFC9_12px_24px)] p-3 text-center ${className}`}
    >
      <span className="max-w-[16rem] rounded-md bg-cream/90 px-3 py-2 text-[13px] font-semibold leading-snug text-cocoa-soft">
        <span className="block text-[11px] uppercase tracking-[0.12em]">{t("photoNeeded")}</span>
        {slot?.need ?? alt}
      </span>
    </div>
  );
}

export function LangToggle({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  const { lang, setLang, t } = useApp();
  const btn = (l: "en" | "pt", label: string) => (
    <button
      type="button"
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      lang={l === "pt" ? "pt-BR" : "en"}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded px-1.5 text-[15px] font-bold tracking-wide transition-colors ${
        lang === l
          ? `${dark ? "text-cream" : "text-cocoa"} underline decoration-2 underline-offset-4 ${dark ? "decoration-pink-light" : "decoration-pink"}`
          : `${dark ? "text-cream/75 hover:text-cream" : "text-cocoa-soft hover:text-cocoa"}`
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label={t("a11y.lang")} className={`flex items-center ${className}`}>
      {btn("en", "EN")}
      <span aria-hidden className={dark ? "text-cream/60" : "text-cocoa-soft"}>
        |
      </span>
      {btn("pt", "PT")}
    </div>
  );
}

export function useOpenStatus() {
  const [status, setStatus] = useState<OpenStatus | null>(null);
  useEffect(() => {
    const tick = () => setStatus(openStatus());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return status;
}

export function useOpenLabel() {
  const { t, lang } = useApp();
  const s = useOpenStatus();
  if (!s) return null;
  if (s.kind === "open") return { open: true, text: t("hours.openUntil", { time: fmtTime(s.until, lang) }) };
  if (s.kind === "later") return { open: false, text: t("hours.opensToday", { time: fmtTime(s.at, lang) }) };
  return { open: false, text: t("hours.opensOn", { day: t(`dayShort.${s.day}` as Key), time: fmtTime(s.at, lang) }) };
}

/** Computed in the browser in America/New_York; hidden in the static HTML so it never shows a wrong guess. */
export function OpenChip({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  const label = useOpenLabel();
  return (
    <span
      aria-live="polite"
      className={`inline-flex min-h-[32px] items-center gap-2 whitespace-nowrap rounded-full px-3 text-[14px] font-semibold ${
        dark ? "bg-cream/10 text-cream" : "bg-cream-deep text-cocoa"
      } ${label ? "" : "invisible"} ${className}`}
    >
      <span aria-hidden className={`h-2 w-2 rounded-full ${label?.open ? "bg-emerald-600" : dark ? "bg-pink-light" : "bg-pink"}`} />
      {label?.text ?? "Open"}
    </span>
  );
}

export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`mb-3 text-[13px] font-extrabold uppercase tracking-[0.16em] ${dark ? "text-pink-light" : "text-pink"}`}>{children}</p>
  );
}

export function SampleTag({ className = "" }: { className?: string }) {
  const { t } = useApp();
  return (
    <span
      className={`inline-block rounded-full border border-dashed border-current px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${className}`}
    >
      {t("sample")}
    </span>
  );
}

export const price = (n: number) => `$${n.toFixed(2)}`;

type IconName =
  | "phone" | "menu" | "close" | "pin" | "ig" | "fb" | "cake" | "arrow" | "back" | "check" | "chevL" | "chevR" | "clock" | "gift" | "upload";

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };
  switch (name) {
    case "phone":
      return (
        <svg {...common}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
        </svg>
      );
    case "menu":
      return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "close":
      return <svg {...common}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case "pin":
      return <svg {...common}><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case "ig":
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>;
    case "fb":
      return <svg {...common}><path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z" /></svg>;
    case "cake":
      return (
        <svg {...common}>
          <path d="M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M5 16c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 5 0M12 12V8M12 5.5a1.2 1.2 0 0 0 0-2.5c0 1-1.2 1.2-1.2 2.3A1.2 1.2 0 0 0 12 6.5z" />
        </svg>
      );
    case "arrow":
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "back":
      return <svg {...common}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>;
    case "check":
      return <svg {...common}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
    case "chevL":
      return <svg {...common}><path d="M15 6l-6 6 6 6" /></svg>;
    case "chevR":
      return <svg {...common}><path d="M9 6l6 6-6 6" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "gift":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M5 12v9h14v-9M12 8v13M12 8c-1.5-3-5-3.5-5-1.5S10 8 12 8zm0 0c1.5-3 5-3.5 5-1.5S14 8 12 8z" />
        </svg>
      );
    case "upload":
      return <svg {...common}><path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>;
  }
}
