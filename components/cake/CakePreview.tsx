"use client";
import { flavorById, sizeById, type CakeState } from "@/components/cake/cakeData";

const FILLING_COLORS: Record<string, string> = {
  brigadeiro: "#5A3324",
  ninho: "#FFF3D6",
  morango: "#E5566F",
  maracuja: "#F2C14E",
  "doce-de-leite": "#C98B4E",
  coco: "#FFFFFF",
};

/** Simple illustrated preview (not a photo) that reflects size, flavor and filling as they're chosen. */
export function CakePreview({ s, className = "" }: { s: CakeState; className?: string }) {
  const size = sizeById(s.size);
  const tiers = size?.tiers ?? 1;
  const widths = tiers > 1 ? [64, 48, 32] : [size?.id === "6in" ? 48 : size?.id === "8in" ? 56 : size ? 64 : 52];
  const frosting = flavorById(s.flavor)?.color ?? "#F3E6D3";
  const filling = FILLING_COLORS[s.filling] ?? "#E6D5BE";
  const tierH = tiers > 1 ? 16 : 26;
  let y = 84;
  return (
    <div className={`flex items-center justify-center ${className}`} aria-hidden>
      <svg viewBox="0 0 96 96" className="h-full w-full">
        <ellipse cx="48" cy="86" rx="38" ry="4" fill="#3E2318" opacity="0.12" />
        <rect x="10" y="83" width="76" height="3" rx="1.5" fill="#C8336E" />
        {widths.map((w, i) => {
          y -= tierH;
          const x = 48 - w / 2;
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={tierH} rx="3" fill={frosting} stroke="#3E2318" strokeOpacity="0.25" />
              <rect x={x} y={y + tierH / 2 - 1.5} width={w} height="3" fill={filling} stroke="#3E2318" strokeOpacity="0.15" />
              <path
                d={`M${x} ${y + 3} q ${w / 8} 5 ${w / 4} 0 t ${w / 4} 0 t ${w / 4} 0 t ${w / 4} 0`}
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity="0.7"
                strokeWidth="2"
              />
            </g>
          );
        })}
        {/* candle */}
        <rect x="46.5" y={y - 12} width="3" height="12" rx="1" fill="#F4A6C2" />
        <path d={`M48 ${y - 18} q 3 3 0 5 q -3 -2 0 -5z`} fill="#F2C14E" />
      </svg>
    </div>
  );
}
