"use client";

import { useEffect, useRef } from "react";

/**
 * Bulletproof fade-up hook:
 * - Watches for DOM changes (MutationObserver)
 * - Re-attaches IntersectionObserver automatically
 * - Works with JSON, CMS blocks, dynamic rendering
 */
export function useFadeUp() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let io: IntersectionObserver | null = null;

    const attach = () => {
      const targets = container.querySelectorAll<HTMLElement>(".fade-up");
      if (!targets.length) return;

      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              io?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );

      targets.forEach((el) => io!.observe(el));
    };

    // Run once on mount
    attach();

    // Watch for DOM changes (JSON render, CMS blocks, async fetch)
    const mo = new MutationObserver(() => {
      io?.disconnect();
      attach();
    });

    mo.observe(container, { childList: true, subtree: true });

    return () => {
      io?.disconnect();
      mo.disconnect();
    };
  }, []);

  return ref;
}
