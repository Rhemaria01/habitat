"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HABITAT_PET_CARD_SELECTOR } from "./constants";

export function usePetCardHost(enabled: boolean): HTMLElement | null {
  const pathname = usePathname();
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      setHost(null);
      return;
    }

    let raf = 0;
    let cancelled = false;

    const sync = () => {
      if (cancelled) return;
      const el = document.querySelector(HABITAT_PET_CARD_SELECTOR);
      const next = el instanceof HTMLElement ? el : null;
      setHost((prev) => (prev === next ? prev : next));
      if (!next) raf = requestAnimationFrame(sync);
    };

    sync();

    const mo =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => sync())
        : null;
    mo?.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("resize", sync, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      mo?.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [enabled, pathname]);

  return host;
}
