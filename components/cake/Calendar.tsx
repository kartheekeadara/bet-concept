"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/lang";
import { Icon } from "@/components/ui";
import { fmtDate, locale, todayYMD } from "@/components/cake/cakeData";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Month calendar. Disabled: past dates, Mondays (closed), anything inside the size's lead time.
 * Keyboard: Tab to the grid, arrow keys move by day/week, Enter/Space selects.
 */
export function Calendar({
  value,
  onChange,
  isAllowed,
  initialMonth,
  minMonth,
  maxMonth,
  error,
}: {
  value: string;
  onChange: (ymd: string) => void;
  isAllowed: (ymd: string) => boolean;
  initialMonth: string;
  minMonth: string;
  maxMonth: string;
  error?: string;
}) {
  const { t, lang } = useApp();
  const [ym, setYm] = useState(initialMonth.slice(0, 7));
  const [y, m] = ym.split("-").map(Number);
  const today = todayYMD();

  const days = useMemo(() => {
    const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells: (string | null)[] = Array(first).fill(null);
    for (let d = 1; d <= count; d++) cells.push(`${y}-${pad(m)}-${pad(d)}`);
    return cells;
  }, [y, m]);

  const shift = (n: number) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    setYm(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`);
  };
  const canPrev = ym > minMonth.slice(0, 7);
  const canNext = ym < maxMonth.slice(0, 7);

  const monthRaw = new Intl.DateTimeFormat(locale(lang), { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
  const monthLabel = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale(lang), { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + i))),
  );

  // roving focus target: selected date, else first allowed date in view
  const focusTarget = (value && value.startsWith(ym) ? value : null) ?? days.find((d) => d && isAllowed(d)) ?? null;

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, ymd: string) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const d = new Date(`${ymd}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    const next = d.toISOString().slice(0, 10);
    if (!next.startsWith(ym)) {
      if ((delta < 0 && !canPrev) || (delta > 0 && !canNext)) return;
      shift(delta < 0 ? -1 : 1);
    }
    window.setTimeout(() => document.querySelector<HTMLButtonElement>(`[data-ymd="${next}"]`)?.focus(), 0);
  };

  return (
    <div>
      <div className={`rounded-2xl border-2 bg-white p-3 sm:p-5 ${error ? "border-pink" : "border-cream-line"}`}>
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shift(-1)}
            disabled={!canPrev}
            aria-label={t("a11y.prevMonth")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-cream-deep disabled:opacity-30"
          >
            <Icon name="chevL" />
          </button>
          <p className="font-display text-[20px] font-semibold" aria-live="polite">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => shift(1)}
            disabled={!canNext}
            aria-label={t("a11y.nextMonth")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-cream-deep disabled:opacity-30"
          >
            <Icon name="chevR" />
          </button>
        </div>
        <div role="grid" aria-label={monthLabel} aria-describedby={error ? "err-date" : undefined}>
          <div role="row" className="grid grid-cols-7 text-center text-[13px] font-bold uppercase text-cocoa-soft">
            {weekdays.map((w, i) => (
              <span role="columnheader" key={i} className="py-1">
                {w}
              </span>
            ))}
          </div>
          <div role="row" className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (!d) return <span key={`e${i}`} role="gridcell" />;
              const allowed = isAllowed(d);
              const selected = d === value;
              const isToday = d === today;
              return (
                <span key={d} role="gridcell" aria-selected={selected}>
                  <button
                    type="button"
                    data-ymd={d}
                    data-field={d === focusTarget ? "date" : undefined}
                    tabIndex={d === focusTarget ? 0 : -1}
                    disabled={!allowed}
                    onClick={() => onChange(d)}
                    onKeyDown={(e) => onKey(e, d)}
                    aria-label={fmtDate(d, lang, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    aria-pressed={selected}
                    className={`relative flex h-11 w-full items-center justify-center rounded-xl text-[16px] font-bold tabular-nums transition-colors sm:h-12 ${
                      selected
                        ? "bg-pink text-white"
                        : allowed
                          ? "bg-cream text-cocoa hover:bg-cocoa hover:text-cream"
                          : "cursor-not-allowed text-cocoa-soft/50 line-through decoration-1"
                    }`}
                  >
                    {Number(d.slice(8))}
                    {isToday && <span aria-hidden className="absolute bottom-1 h-1 w-1 rounded-full bg-current" />}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      </div>
      {error && (
        <p id="err-date" role="alert" className="err">
          {error}
        </p>
      )}
    </div>
  );
}
