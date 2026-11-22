"use client";
import { useEffect, useState } from "react";

/**
 * Returns the id of the last section whose top has scrolled past the sticky chrome.
 * `offset` is how far below the viewport top the "reading line" sits (header + category bar).
 */
export function useScrollSpy(ids: string[], offset: { base: number; lg: number }) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    let frame = 0;
    const lg = window.matchMedia("(min-width: 1024px)");
    const measure = () => {
      frame = 0;
      const line = (lg.matches ? offset.lg : offset.base) + 8;
      let cur = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - line <= 0) cur = id;
      }
      setActive(cur);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // settle on the final position even when frames are throttled (background tab, long smooth scroll)
    window.addEventListener("scrollend", measure);
    return () => {
      window.removeEventListener("scrollend", measure);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ids, offset.base, offset.lg]);
  return active;
}
