import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Static GitHub Pages host has no image optimizer; plain <img> with explicit sizes is intentional.
  { rules: { "@next/next/no-img-element": "off" } },
];

export default eslintConfig;
