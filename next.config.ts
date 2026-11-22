import type { NextConfig } from "next";

// GitHub Pages build: static export under /<repo>. Set by scripts/deploy-pages.sh.
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? process.env.BASE_PATH ?? "" : "";

const nextConfig: NextConfig = {
  devIndicators: { appIsrStatus: false, buildActivity: false },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  distDir: process.env.NEXT_DIST_DIR || ".next",
  ...(pages ? { output: "export" as const, basePath, trailingSlash: true, images: { unoptimized: true } } : {}),
};

export default nextConfig;
