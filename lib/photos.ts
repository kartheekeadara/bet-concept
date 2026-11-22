import fs from "node:fs";
import path from "node:path";
import site from "@/data/site.json";

export type PhotoInfo = { src: string | null; need: string };
export type PhotoMap = { slots: Record<string, PhotoInfo>; menu: Record<string, string>; logo: string | null };

const REAL = path.join(process.cwd(), "public", "photos", "real");

/** Runs at build time: only photos that actually exist in public/photos/real/ get a src. */
export function resolvePhotos(): PhotoMap {
  const slots: Record<string, PhotoInfo> = {};
  for (const [id, p] of Object.entries(site.photos)) {
    const exists = fs.existsSync(path.join(REAL, p.file));
    slots[id] = { src: exists ? `/photos/real/${p.file}` : null, need: p.need };
  }
  const menu: Record<string, string> = {};
  // temporary stand-ins first (see public/photos/placeholder/CREDITS.md), then real photos override by id
  for (const base of ["placeholder", "real"]) {
    const menuDir = path.join(process.cwd(), "public", "photos", base, "menu");
    if (!fs.existsSync(menuDir)) continue;
    for (const f of fs.readdirSync(menuDir)) {
      const m = f.match(/^(.+)\.(jpe?g|png|webp)$/i);
      if (m) menu[m[1]] = `/photos/${base}/menu/${f}`;
    }
  }
  const logoFile = ["logo.svg", "logo.png", "logo.webp"].find((f) => fs.existsSync(path.join(REAL, f)));
  return { slots, menu, logo: logoFile ? `/photos/real/${logoFile}` : null };
}
