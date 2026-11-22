import raw from "@/data/menu.json";

export type MenuItem = {
  id: string;
  pt: string;
  en: string;
  price: number | null;
  popular?: boolean;
  weekday?: boolean;
  monthly?: boolean;
  unitKey?: string;
};
export type MenuCategory = { id: string; pt: string; noteKey?: string; items: MenuItem[] };

export const categories = raw.categories as MenuCategory[];
export const findItem = (id: string) => categories.flatMap((c) => c.items).find((i) => i.id === id)!;
