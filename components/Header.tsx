"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import site from "@/data/site.json";
import { useApp } from "@/lib/lang";
import { asset } from "@/lib/asset";
import { Icon, LangToggle } from "@/components/ui";

export function Logo({ dark = false, compact = false, className = "" }: { dark?: boolean; compact?: boolean; className?: string }) {
  const { photos } = useApp();
  const src = asset(photos.logo ?? "/photos/real/logo.png");
  return (
    <Link href="/" className={`inline-flex min-h-[44px] items-center ${className}`}>
      {dark ? (
        // brown logo on a cream disc so it reads on dark sections
        <span className={`inline-flex rounded-full bg-cream ${compact ? "p-0.5" : "p-1.5"}`}>
          <img
            src={src}
            alt="Brazilian Eats & Treats"
            width={compact ? 44 : 72}
            height={compact ? 44 : 72}
            className={compact ? "h-11 w-11" : "h-[72px] w-[72px]"}
          />
        </span>
      ) : (
        <img src={src} alt="Brazilian Eats & Treats" width={44} height={44} className="h-11 w-11" />
      )}
    </Link>
  );
}

const NAV = [
  { href: "/#menu", key: "nav.menu" },
  { href: "/#cakes", key: "nav.cakes" },
  { href: "/#catering", key: "nav.catering" },
  { href: "/#visit", key: "nav.visit" },
] as const;

export function Header() {
  const { t } = useApp();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-cream-line bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/85">
      <div className="mx-auto flex h-[68px] max-w-page items-center gap-3 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="inline-flex min-h-[44px] items-center rounded-full px-3 text-[16px] font-bold text-cocoa hover:bg-cream-deep"
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LangToggle />
          <Link href="/order-cake" className="btn-primary hidden min-h-[44px] px-5 lg:inline-flex">
            {t("cta.orderCake")}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t("a11y.openMenu")}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-cocoa hover:bg-cream-deep lg:hidden"
          >
            <Icon name="menu" className="h-6 w-6" />
          </button>
        </div>
      </div>

      {open &&
        createPortal(
        <div id="mobile-nav" role="dialog" aria-modal="true" aria-label={t("a11y.openMenu")} className="fixed inset-0 z-50 overflow-y-auto bg-cocoa pb-10 text-cream lg:hidden">
          <div className="flex h-[68px] items-center justify-between px-4">
            <Logo dark compact />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("a11y.closeMenu")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-cream/10"
              autoFocus
            >
              <Icon name="close" className="h-6 w-6" />
            </button>
          </div>
          <nav aria-label="Mobile" className="px-4 pt-6">
            <ul className="space-y-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[56px] items-center border-b border-cream/15 font-display text-[30px] font-semibold"
                  >
                    {t(n.key)}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/order-cake" onClick={() => setOpen(false)} className="btn-primary">
                {t("cta.orderCake")}
              </Link>
              <a href={`tel:${site.phone.tel}`} className="btn-ghost-light">
                <Icon name="phone" /> {site.phone.display}
              </a>
              <LangToggle dark inline />
            </div>
          </nav>
        </div>,
          document.body,
        )}
    </header>
  );
}

/** Phone-only sticky bar: the two things people actually come to do. */
export function MobileBar() {
  const { t } = useApp();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-line bg-cream/95 px-4 pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] gap-2">
        <Link href="/order-cake" className="btn-primary">
          <Icon name="cake" /> {t("cta.orderCake")}
        </Link>
        <a href={`tel:${site.phone.tel}`} className="btn-ghost px-5">
          <Icon name="phone" /> {t("cta.call")}
        </a>
      </div>
    </div>
  );
}
