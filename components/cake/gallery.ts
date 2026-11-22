import type { Key } from "@/data/i18n";

/**
 * Marcia's cakes (retouched photos from the bakery's Google listing and studio shots).
 * Shared by the homepage gallery and the builder's "start from one of Marcia's cakes" step.
 * Photo ids map to slots in data/site.json.
 * `colors` and `addons` are a best guess from the photo; picking the cake pre-fills them and
 * the customer can change everything.
 */
export const GALLERY: { id: string; key: Key; style: string; colors: string[]; addons: string[]; pos?: string }[] = [
  { id: "cake-wedding", style: "ridged", key: "cakes.g1", colors: ["whiteGold"], addons: ["flowers"] },
  { id: "cake-floral-tier", style: "floral", key: "cakes.g2", colors: ["pastel"], addons: ["flowers"] },
  { id: "cake-chanel", style: "showpiece", key: "cakes.g3", colors: ["blush"], addons: ["gold"] },
  { id: "cake-1", style: "drip", key: "cakes.g4", colors: ["chocolate"], addons: ["strawberries"] },
  { id: "cake-pink-piped", style: "piped", key: "cakes.g5", colors: ["blush"], addons: [] },
  { id: "cake-red", style: "character", key: "cakes.g6", colors: ["bright"], addons: ["topper"] },
  { id: "cake-stroke", style: "brushstroke", key: "cakes.g7", colors: ["whiteGold"], addons: [] },
  { id: "cake-3", style: "sprinkles", key: "cakes.g8", colors: ["chocolate"], addons: ["strawberries"] },
  { id: "cake-rip", style: "twotone", key: "cakes.g9", colors: [], addons: [] },
];

export const galleryById = (id: string) => GALLERY.find((g) => g.id === id);
