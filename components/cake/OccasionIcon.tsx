/** 1.5px-stroke line icons for the occasion cards, drawn in cocoa brown. Decorative (the card has a text label). */
export function OccasionIcon({ id, className = "h-9 w-9" }: { id: string; className?: string }) {
  const p = {
    className: `${className} text-cocoa`,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (id) {
    case "birthday": // layer cake with a candle
      return (
        <svg {...p}>
          <path d="M5 27h22M7 27v-9a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 25 18v9" />
          <path d="M7 21.5c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0" />
          <path d="M16 16.5V12" />
          <path d="M16 9.5c1-1 1.3-2.2 0-4-1.3 1.8-1 3 0 4z" />
        </svg>
      );
    case "wedding": // two interlocking rings
      return (
        <svg {...p}>
          <circle cx="12" cy="19" r="6.5" />
          <circle cx="20" cy="19" r="6.5" />
          <path d="M10 8.5l2 2.5 2-2.5-2-2z" />
        </svg>
      );
    case "baby": // baby bottle
      return (
        <svg {...p}>
          <path d="M14 4.5h4M13 8h6l-.5-3.5h-5zM12 8h8a1 1 0 0 1 1 1v1.5l-1 1.5v13a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V12l-1-1.5V9a1 1 0 0 1 1-1z" />
          <path d="M13 16h3M13 19.5h3M13 23h3" />
        </svg>
      );
    case "graduation": // mortarboard
      return (
        <svg {...p}>
          <path d="M3.5 12.5L16 7l12.5 5.5L16 18z" />
          <path d="M9 15.5v5.5c0 1.5 3.1 3 7 3s7-1.5 7-3v-5.5" />
          <path d="M28.5 12.5v7" />
        </svg>
      );
    default: // just because: heart
      return (
        <svg {...p}>
          <path d="M16 26s-10-6.2-10-13a5.5 5.5 0 0 1 10-3.2A5.5 5.5 0 0 1 26 13c0 6.8-10 13-10 13z" />
        </svg>
      );
  }
}
