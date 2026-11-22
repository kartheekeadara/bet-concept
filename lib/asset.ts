/** Prefix a public/ path with the GitHub Pages base path (/bet-concept) when deployed. */
export const asset = (p: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${p}`;
