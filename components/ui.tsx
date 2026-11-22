"use client";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/lang";
import { asset } from "@/lib/asset";

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
          alt={alt === "" ? "" : slot.need || alt}
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

const LANGS = [
  { id: "en", code: "EN", name: "English", html: "en" },
  { id: "pt", code: "PT", name: "Português", html: "pt-BR" },
] as const;

/**
 * Language menu (Uber-style globe pill + Amazon-style list): the pill shows the current language,
 * the menu lists each language in its own name with a check on the active one.
 * `inline` renders the two options as a full-width segmented choice (mobile drawer).
 */
export function LangToggle({ className = "", dark = false, inline = false }: { className?: string; dark?: boolean; inline?: boolean }) {
  const { lang, setLang, t } = useApp();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.id === lang)!;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (inline) {
    return (
      <div role="radiogroup" aria-label={t("a11y.lang")} className={`grid grid-cols-2 gap-1 rounded-full p-1 ${dark ? "bg-cream/10" : "bg-cream-deep"} ${className}`}>
        {LANGS.map((l) => {
          const on = l.id === lang;
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={on}
              lang={l.html}
              onClick={() => setLang(l.id)}
              className={`min-h-[44px] rounded-full px-4 text-[16px] font-bold transition-colors ${
                on ? (dark ? "bg-cream text-cocoa" : "bg-cocoa text-cream") : dark ? "text-cream" : "text-cocoa"
              }`}
            >
              {l.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${t("a11y.lang")}: ${current.name}`}
        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-2 px-3 text-[15px] font-bold transition-colors ${
          dark ? "border-cream/30 text-cream hover:bg-cream/10" : "border-cream-line text-cocoa hover:border-cocoa"
        }`}
      >
        <Icon name="globe" className="h-[18px] w-[18px]" />
        {current.code}
        <Icon name="chevD" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="absolute right-0 top-[calc(100%+6px)] z-50 w-48 overflow-hidden rounded-2xl border border-cream-line bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(62,35,24,0.35)]">
          {LANGS.map((l) => {
            const on = l.id === lang;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  lang={l.html}
                  aria-current={on ? "true" : undefined}
                  onClick={() => {
                    setLang(l.id);
                    setOpen(false);
                  }}
                  className={`flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 text-left text-[16px] ${
                    on ? "bg-cream font-extrabold text-cocoa" : "font-semibold text-cocoa hover:bg-cream"
                  }`}
                >
                  {l.name}
                  {on && <Icon name="check" className="h-5 w-5 text-brand" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`mb-3 text-[13px] font-extrabold uppercase tracking-[0.16em] ${dark ? "text-brand-light" : "text-brand"}`}>{children}</p>
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

/** The little white tag from the pastry case: punched hole, tabular price, optional unit. */
export function PriceTag({ amount, unit, className = "" }: { amount: number; unit?: string; className?: string }) {
  return (
    <span
      className={`relative inline-flex items-baseline gap-1 whitespace-nowrap rounded-[6px] border border-cocoa/15 bg-white py-0.5 pl-5 pr-2.5 text-[16px] font-extrabold tabular-nums text-cocoa shadow-[0_1px_0_rgba(62,35,24,0.12)] ${className}`}
    >
      <span aria-hidden className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-cream-deep ring-1 ring-cocoa/25" />
      {price(amount)}
      {unit && <span className="text-[12px] font-semibold text-cocoa-soft">/ {unit}</span>}
    </span>
  );
}

type IconName =
  | "phone" | "menu" | "close" | "pin" | "ig" | "fb" | "cake" | "arrow" | "back" | "check" | "chevL" | "chevR" | "chevD" | "clock" | "gift" | "upload" | "globe" | "users" | "expand" | "star";

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
    case "chevD":
      return <svg {...common}><path d="M6 9l6 6 6-6" /></svg>;
    case "globe":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></svg>;
    case "users":
      return <svg {...common}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.6 3.5 5.2" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "gift":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M5 12v9h14v-9M12 8v13M12 8c-1.5-3-5-3.5-5-1.5S10 8 12 8zm0 0c1.5-3 5-3.5 5-1.5S14 8 12 8z" />
        </svg>
      );
    case "star":
      return <svg {...common} fill="currentColor" stroke="none"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" /></svg>;
    case "expand":
      return <svg {...common}><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></svg>;
    case "upload":
      return <svg {...common}><path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>;
  }
}
