"use client";
import { useId } from "react";
import { flavorById, type CakeState } from "@/components/cake/cakeData";

/** Filling colors for swatches, pairings and the slice in the drawing. */
export const FILLING_COLORS: Record<string, string> = {
  brigadeiro: "#5A3324",
  ninho: "#FFF3D6",
  morango: "#E5566F",
  maracuja: "#F2C14E",
  "doce-de-leite": "#C98B4E",
  coco: "#FFFFFF",
};

/** Frosting tint for each "color idea" chip on the Outside step. */
const IDEA_FROST: Record<string, string> = {
  whiteGold: "#FFFBF3",
  blush: "#F7CFD6",
  pastel: "#EFE4F6",
  chocolate: "#7A4A33",
  bright: "#FFD25E",
};
/** Frosting a style implies when no color idea is chosen. */
const STYLE_FROST: Record<string, string> = {
  sprinkles: "#5A3324",
  drip: "#EBDCC9",
  character: "#D9433A",
};

type Tier = { w: number; h: number };
const TIERS: Record<string, Tier[]> = {
  "6in": [{ w: 128, h: 92 }],
  "8in": [{ w: 178, h: 112 }],
  "10in": [{ w: 230, h: 128 }],
  tiered: [
    { w: 230, h: 98 },
    { w: 150, h: 88 },
  ],
};

/** Long messages wrap onto two lines at the space nearest the middle. */
function messageLines(msg: string) {
  if (msg.length <= 16 || !msg.includes(" ")) return [msg];
  const mid = msg.length / 2;
  let cut = -1;
  for (let i = 0; i < msg.length; i++) if (msg[i] === " " && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
  return [msg.slice(0, cut), msg.slice(cut + 1)];
}

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
};
const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, "0")).join("")}`;
};

/**
 * The live cake drawing. Every choice shows up: size (width / tiers), sponge + filling (the slice on the
 * plate), style (ridges, drip, sprinkles, flowers, piping, brushstrokes, toppers, two-tone, showpiece),
 * color idea (frosting tint, latest chip wins), message (script or print, on the top or the side),
 * extras, and a candle for birthdays.
 * `sizeOverride` + `minimal` draw a plain silhouette for the size cards.
 */
export function CakeArt({
  s,
  className = "",
  sizeOverride,
  minimal = false,
}: {
  s: CakeState;
  className?: string;
  sizeOverride?: string;
  minimal?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const sizeId = sizeOverride ?? (s.size || "8in");
  const tiers = TIERS[sizeId] ?? TIERS["8in"];
  const style = minimal ? "" : s.style;
  const colorIdea = s.colorIds[s.colorIds.length - 1];
  const frost = minimal ? "#E9D3B6" : (colorIdea && IDEA_FROST[colorIdea]) || STYLE_FROST[style] || "#FFF8EE";
  const dark = isDark(frost);
  const sponge = flavorById(s.flavor)?.color ?? "#E9C99B";
  const filling = FILLING_COLORS[s.filling] ?? "#F3E6D3";
  const add = new Set(minimal ? [] : s.addons);
  const tr = { transition: "fill 250ms ease, d 300ms ease, transform 300ms ease" } as const;

  // stack tiers from the board up
  const cx = minimal ? 200 : 178;
  let bottom = 300;
  const geo = tiers.map((t) => {
    const ry = t.w * 0.13;
    const top = bottom - t.h;
    const g = { ...t, ry, top, bottom, l: cx - t.w / 2, r: cx + t.w / 2 };
    bottom = top + 2;
    return g;
  });
  const topT = geo[geo.length - 1];
  const bodyPath = (g: (typeof geo)[number]) => `M${g.l} ${g.top} L${g.l} ${g.bottom} A${g.w / 2} ${g.ry} 0 0 0 ${g.r} ${g.bottom} L${g.r} ${g.top} Z`;
  // y on the front edge of an ellipse at x
  const edgeY = (g: (typeof geo)[number], y0: number, x: number) => y0 + g.ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / (g.w / 2)) ** 2));

  const msg = minimal ? "" : s.message.trim();
  // the drip covers the top surface in chocolate, so lettering on top goes light there
  const onDark = s.placement === "top" && style === "drip" ? true : dark && style !== "twotone";
  const msgFill = onDark ? "#FFF8EE" : "#A8261F";
  const msgHalo = onDark ? "#3E2318" : "#FFF8EE";
  const candle = !minimal && s.occasion === "birthday" && !add.has("topper") && !add.has("figure") && style !== "character" && style !== "showpiece";

  return (
    <svg viewBox="0 0 400 360" className={className} aria-hidden>
      <defs>
        <linearGradient id={`sh-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#3E2318" stopOpacity="0.16" />
        </linearGradient>
        <pattern id={`spr-${uid}`} width="14" height="14" patternUnits="userSpaceOnUse">
          <rect x="2" y="3" width="5" height="1.8" rx="0.9" fill="#2C180F" transform="rotate(30 4 4)" />
          <rect x="8" y="9" width="5" height="1.8" rx="0.9" fill="#8A5A3C" transform="rotate(-40 10 10)" />
          <rect x="9" y="2" width="4" height="1.6" rx="0.8" fill="#3E2318" transform="rotate(80 11 3)" />
          <rect x="1" y="10" width="4" height="1.6" rx="0.8" fill="#6B4A3C" transform="rotate(-10 3 11)" />
        </pattern>
        <pattern id={`crumb-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill="#fff" opacity="0.35" />
          <circle cx="6" cy="5.5" r="0.8" fill="#3E2318" opacity="0.18" />
        </pattern>
        {geo.map((g, i) => (
          <clipPath key={i} id={`c-${uid}-${i}`}>
            <path d={bodyPath(g)} />
          </clipPath>
        ))}
      </defs>

      {/* board + soft shadow */}
      <ellipse cx="200" cy="312" rx="178" ry="24" fill="#3E2318" opacity="0.08" />
      <ellipse cx="200" cy="306" rx="172" ry="22" fill="#F3E6D3" stroke="#3E2318" strokeOpacity="0.12" />

      {/* the slice on a little plate: sponge (flavor) + filling layers */}
      {!minimal && (
        <g>
          <ellipse cx="338" cy="306" rx="46" ry="9" fill="#fff" stroke="#3E2318" strokeOpacity="0.15" />
          <path d="M306 262 L362 262 L362 302 L306 302 Z" fill={sponge} style={tr} />
          <path d="M306 262 L362 262 L362 302 L306 302 Z" fill={`url(#crumb-${uid})`} />
          <rect x="306" y="275" width="56" height="5" fill={filling} style={tr} stroke="#3E2318" strokeOpacity="0.1" />
          <rect x="306" y="289" width="56" height="5" fill={filling} style={tr} stroke="#3E2318" strokeOpacity="0.1" />
          <path d="M306 262 L362 262 L350 250 L318 250 Z" fill={frost} style={tr} stroke="#3E2318" strokeOpacity="0.12" />
          <rect x="358" y="262" width="4" height="40" fill={frost} style={tr} />
          <path d="M306 262 L362 262 L362 302 L306 302 Z" fill="none" stroke="#3E2318" strokeOpacity="0.15" />
        </g>
      )}

      {geo.map((g, i) => {
        const isTop = i === geo.length - 1;
        const clip = `url(#c-${uid}-${i})`;
        return (
          <g key={i}>
            <path d={bodyPath(g)} fill={frost} style={tr} />
            {style === "sprinkles" && <path d={bodyPath(g)} fill={`url(#spr-${uid})`} />}

            {/* two-tone: left half dark with lettering contrast */}
            {style === "twotone" && <rect x={g.l} y={g.top - g.ry} width={g.w / 2} height={g.h + g.ry * 2} fill="#2A2522" clipPath={clip} />}

            {/* ridged buttercream */}
            {style === "ridged" &&
              Array.from({ length: 5 }, (_, k) => {
                const y = g.top + ((k + 1) * g.h) / 6;
                return (
                  <g key={k} clipPath={clip}>
                    <path d={`M${g.l} ${y} A${g.w / 2} ${g.ry} 0 0 0 ${g.r} ${y}`} fill="none" stroke="#3E2318" strokeOpacity="0.12" strokeWidth="2" />
                    <path d={`M${g.l} ${y + 2} A${g.w / 2} ${g.ry} 0 0 0 ${g.r} ${y + 2}`} fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" />
                  </g>
                );
              })}

            {/* brushstrokes */}
            {style === "brushstroke" && (
              <g clipPath={clip}>
                {[
                  ["#F07A5E", 0.52, -0.1],
                  ["#2E3F6E", 0.62, 0.15],
                  ["#D9433A", 0.72, 0.35],
                  ["#8EC5E8", 0.82, 0.6],
                ].map(([c, fx, fy], k) => (
                  <rect
                    key={k}
                    x={g.l + g.w * (fx as number)}
                    y={g.top + g.h * (fy as number)}
                    width={g.w * 0.16}
                    height={g.h * 0.5}
                    rx="8"
                    fill={c as string}
                    transform={`rotate(28 ${g.l + g.w * (fx as number)} ${g.top + g.h * (fy as number)})`}
                  />
                ))}
              </g>
            )}

            {/* floral: little painted flowers + butterflies on the sides */}
            {style === "floral" && (
              <g clipPath={clip}>
                {[0.18, 0.42, 0.66, 0.86].map((fx, k) => (
                  <Flower key={k} x={g.l + g.w * fx} y={g.top + g.h * (k % 2 ? 0.62 : 0.35)} r={5} color={["#C9A0E8", "#F4A6C2", "#7FB3E8", "#F2C14E"][k]} />
                ))}
                {[0.3, 0.75].map((fx, k) => (
                  <path key={k} d={`M${g.l + g.w * fx} ${g.top + g.h * 0.5} l-7 -6 l1 10 z M${g.l + g.w * fx} ${g.top + g.h * 0.5} l7 -6 l-1 10 z`} fill={k ? "#F2C14E" : "#7FB3E8"} />
                ))}
              </g>
            )}

            {/* gold leaf flecks */}
            {add.has("gold") && (
              <g clipPath={clip} fill="#D4A64A">
                {[0.2, 0.34, 0.5, 0.63, 0.78].map((fx, k) => (
                  <path key={k} d={`M${g.l + g.w * fx} ${g.top + g.h * (0.3 + (k % 3) * 0.18)} l5 -3 l3 5 l-6 2 z`} />
                ))}
              </g>
            )}

            {/* sheen */}
            <path d={bodyPath(g)} fill={`url(#sh-${uid})`} />
            {/* top surface */}
            <ellipse cx={cx} cy={g.top} rx={g.w / 2} ry={g.ry} fill={style === "sprinkles" ? frost : shade(frost, 10)} style={tr} stroke="#3E2318" strokeOpacity="0.1" />
            {style === "sprinkles" && <ellipse cx={cx} cy={g.top} rx={g.w / 2} ry={g.ry} fill={`url(#spr-${uid})`} />}
            <path d={bodyPath(g)} fill="none" stroke="#3E2318" strokeOpacity="0.14" />

            {/* vintage piping: shell borders top and bottom + swags */}
            {style === "piped" && (
              <g>
                {Array.from({ length: 11 }, (_, k) => {
                  const x = g.l + 6 + (k * (g.w - 12)) / 10;
                  return (
                    <g key={k}>
                      <circle cx={x} cy={edgeY(g, g.bottom, x) - 3} r="6" fill={["#F4A6C2", "#F2D06B", "#7FD1D0"][k % 3]} />
                      <circle cx={x} cy={edgeY(g, g.top, x) + 1} r="5" fill={["#7FD1D0", "#F4A6C2", "#F2D06B"][k % 3]} />
                    </g>
                  );
                })}
                {[0.25, 0.5, 0.75].map((fx, k) => {
                  const x0 = g.l + g.w * (fx - 0.12);
                  const x1 = g.l + g.w * (fx + 0.12);
                  const y0 = edgeY(g, g.top, x0) + 12;
                  return <path key={k} d={`M${x0} ${y0} Q ${(x0 + x1) / 2} ${y0 + 18} ${x1} ${edgeY(g, g.top, x1) + 12}`} fill="none" stroke="#E5566F" strokeWidth="2.5" />;
                })}
              </g>
            )}

            {/* simple top border when no style is picked */}
            {!style && !minimal && (
              <g fill={shade(frost, -18)}>
                {Array.from({ length: 12 }, (_, k) => {
                  const x = g.l + 5 + (k * (g.w - 10)) / 11;
                  return <circle key={k} cx={x} cy={edgeY(g, g.top, x) + 1} r="4" />;
                })}
              </g>
            )}

            {/* chocolate drip on the top tier */}
            {style === "drip" && isTop && <Drip g={g} cx={cx} edge={(x) => edgeY(g, g.top, x)} />}
          </g>
        );
      })}

      {/* things on top of the top tier */}
      {!minimal && (
        <g>
          {style === "floral" &&
            [-0.28, -0.08, 0.14, 0.3].map((fx, k) => (
              <Flower key={k} x={cx + topT.w * fx} y={topT.top - 6 - (k % 2) * 6} r={9} color={["#F6C1A6", "#F4A6C2", "#FBE3EC", "#F2C14E"][k]} />
            ))}
          {style === "character" && (
            <g>
              <path
                d={`M${cx - 52} ${topT.top} l0 -40 l10 0 l0 -18 l12 0 l0 26 l10 0 l0 -44 l14 0 l0 30 l10 0 l0 -16 l12 0 l0 34 l12 0 l0 -22 l10 0 l0 50 z`}
                fill="#1F1B1A"
              />
              {[-36, -14, 10, 32].map((dx, k) => (
                <circle key={k} cx={cx + dx} cy={topT.top - 2} r="9" fill={k % 2 ? "#2E5BD8" : "#D9433A"} stroke="#fff" strokeOpacity="0.4" />
              ))}
            </g>
          )}
          {style === "showpiece" && (
            <g>
              <path d={`M${cx - 26} ${topT.top - 52} q26 -26 52 0`} fill="none" stroke="#D4A64A" strokeWidth="4" />
              <rect x={cx - 34} y={topT.top - 54} width="68" height="50" rx="10" fill="#F4A6C2" stroke="#3E2318" strokeOpacity="0.15" />
              <path d={`M${cx - 34} ${topT.top - 38} h68`} stroke="#E58CB0" strokeWidth="2" />
              <circle cx={cx} cy={topT.top - 30} r="5" fill="#D4A64A" />
            </g>
          )}
          {add.has("strawberries") &&
            [-0.32, -0.14, 0.04, 0.22, 0.36].map((fx, k) => (
              <g key={k} transform={`translate(${cx + topT.w * fx} ${topT.top - 4 - (k % 2) * 3})`}>
                <path d="M0 -10 C 8 -10 9 -2 0 8 C -9 -2 -8 -10 0 -10 Z" fill="#D7263D" />
                <path d="M-5 -10 L0 -14 L5 -10 L0 -8 Z" fill="#3F8A3A" />
              </g>
            ))}
          {add.has("flowers") && [-0.38, -0.26, 0.4].map((fx, k) => <Flower key={k} x={cx + topT.w * fx} y={topT.top + 2} r={6} color={["#F4A6C2", "#FBE3EC", "#C9A0E8"][k]} />)}
          {add.has("topper") && (
            <g>
              <path d={`M${cx - 18} ${topT.top} L${cx - 14} ${topT.top - 44} M${cx + 18} ${topT.top} L${cx + 14} ${topT.top - 44}`} stroke="#B8893A" strokeWidth="2.5" />
              <path d={`M${cx} ${topT.top - 78} l7 15 l16 2 l-12 11 l3 16 l-14 -8 l-14 8 l3 -16 l-12 -11 l16 -2 z`} fill="#D4A64A" />
            </g>
          )}
          {add.has("figure") && (
            <g transform={`translate(${cx + topT.w * 0.24} ${topT.top - 4})`}>
              <ellipse cx="0" cy="-12" rx="10" ry="13" fill="#7FD1D0" />
              <circle cx="0" cy="-32" r="9" fill="#F6D2B8" />
              <circle cx="-3" cy="-33" r="1.2" fill="#3E2318" />
              <circle cx="3" cy="-33" r="1.2" fill="#3E2318" />
            </g>
          )}
          {candle && (
            <g>
              <rect x={cx - 3} y={topT.top - 34} width="6" height="32" rx="2" fill="#F4A6C2" />
              <path d={`M${cx - 3} ${topT.top - 26} l6 -4 M${cx - 3} ${topT.top - 16} l6 -4`} stroke="#fff" strokeWidth="2" />
              <path d={`M${cx} ${topT.top - 48} q6 6 0 11 q-6 -5 0 -11z`} fill="#F2C14E" />
              <path d={`M${cx} ${topT.top - 44} q3 3 0 6 q-3 -3 0 -6z`} fill="#C8312B" />
            </g>
          )}
        </g>
      )}

      {/* the message, drawn last so toppers never hide it */}
      {msg && <CakeMessage msg={msg} g={topT} cx={cx} top={s.placement === "top"} print={s.lettering === "print"} fill={msgFill} halo={msgHalo} />}
    </svg>
  );
}

function CakeMessage({
  msg,
  g,
  cx,
  top,
  print,
  fill,
  halo,
}: {
  msg: string;
  g: { w: number; h: number; top: number; ry: number };
  cx: number;
  top: boolean;
  print: boolean;
  fill: string;
  halo: string;
}) {
  const lines = messageLines(print ? msg.toUpperCase() : msg);
  const base = (top ? 17 : 19) * (g.w < 150 ? 0.82 : 1) * (print ? 0.86 : 1);
  const size = lines.length > 1 ? base * 0.84 : base;
  const maxW = g.w * (top ? 0.74 : 0.84);
  const gap = size * 1.08;
  const firstY = -((lines.length - 1) * gap) / 2;
  // on top the lettering lies flat on the ellipse; on the side it sits on the front of the top tier
  const transform = top ? `translate(${cx} ${g.top + 4}) scale(1 0.62)` : `translate(${cx} ${g.top + g.h * 0.6})`;
  return (
    <g transform={transform} data-message={top ? "top" : "side"} data-lettering={print ? "print" : "script"}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={firstY + i * gap}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily={print ? "var(--font-sans), system-ui, sans-serif" : "var(--font-accent), Georgia, serif"}
          fontStyle={print ? "normal" : "italic"}
          fontWeight={print ? 800 : 600}
          fontSize={size}
          letterSpacing={print ? 0.6 : 0}
          fill={fill}
          stroke={halo}
          strokeWidth={3}
          strokeLinejoin="round"
          style={{ paintOrder: "stroke" }}
          {...(line.length * size * (print ? 0.68 : 0.48) > maxW ? { textLength: maxW, lengthAdjust: "spacingAndGlyphs" as const } : {})}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function Flower({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * r * 0.9} cy={Math.sin((a * Math.PI) / 180) * r * 0.9} r={r * 0.62} fill={color} />
      ))}
      <circle r={r * 0.42} fill="#F2C14E" />
    </g>
  );
}

function Drip({ g, cx, edge }: { g: { l: number; w: number; top: number; ry: number }; cx: number; edge: (x: number) => number }) {
  // deterministic drip lengths so the cake doesn't "wobble" between renders
  const drops = [14, 26, 10, 34, 18, 28, 12, 22, 30, 16, 24, 12];
  const n = drops.length;
  const step = g.w / n;
  let d = `M${g.l} ${g.top}`;
  for (let k = 0; k <= n; k++) d += ` L${g.l + k * step} ${edge(g.l + k * step)}`;
  // back along the front edge, dipping down into rounded drops
  for (let k = n - 1; k >= 0; k--) {
    const x = g.l + (k + 0.5) * step;
    const y = edge(x);
    d += ` L${x + step * 0.3} ${y + 2} L${x + step * 0.22} ${y + drops[k]} A ${step * 0.22} ${step * 0.22} 0 0 1 ${x - step * 0.22} ${y + drops[k]} L${x - step * 0.3} ${y + 2}`;
  }
  d += " Z";
  return (
    <g>
      <ellipse cx={cx} cy={g.top} rx={g.w / 2} ry={g.ry} fill="#4A2A1E" />
      <path d={d} fill="#4A2A1E" />
      <ellipse cx={cx - g.w * 0.12} cy={g.top - g.ry * 0.25} rx={g.w * 0.18} ry={g.ry * 0.3} fill="#fff" opacity="0.18" />
    </g>
  );
}
