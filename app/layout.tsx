import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";
import site from "@/data/site.json";
import { AppProvider } from "@/lib/lang";
import { resolvePhotos } from "@/lib/photos";
import { SkipLink } from "@/components/SkipLink";

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const sans = Nunito_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const photos = resolvePhotos();
// OG image always points at the deployed URL, never localhost.
const ogPath = photos.slots.hero.src ?? "/og.png";
const ogImage = `${site.siteUrl}${photos.slots.og?.src ?? ogPath}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: "Brazilian Eats & Treats · Brazilian bakery in Ballantyne, Charlotte",
  description:
    "Family-owned Brazilian bakery and lunch spot on Johnston Rd in Charlotte. Coxinhas, pão de queijo, lunch plates and custom celebration cakes. Concept site.",
  // Concept only: keep it out of search until it's on the bakery's real domain.
  robots: { index: false, follow: false },
  openGraph: {
    title: "Brazilian Eats & Treats",
    description: "Sabor de casa. A taste of home, right here in Ballantyne.",
    url: site.siteUrl,
    siteName: "Brazilian Eats & Treats",
    images: [{ url: ogImage, width: 1200, height: 630 }],
    type: "website",
    locale: "en_US",
    alternateLocale: ["pt_BR"],
  },
};

export const viewport: Viewport = { themeColor: "#FBF4EA" };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: site.name,
  url: site.siteUrl,
  telephone: site.phone.tel,
  email: site.email,
  servesCuisine: "Brazilian",
  priceRange: "$",
  founder: { "@type": "Person", name: site.owner },
  foundingDate: "2022-09",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    postalCode: site.address.postal,
    addressCountry: "US",
  },
  sameAs: [site.instagram.url],
  openingHoursSpecification: site.hours.days.flatMap((h, i) =>
    h ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${DAY_NAMES[i]}`, opens: h.open, closes: h.close }] : [],
  ),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-cream font-sans text-[17px] text-cocoa antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <AppProvider photos={photos}>
          <SkipLink />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
