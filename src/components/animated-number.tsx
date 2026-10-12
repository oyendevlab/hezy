"use client";

import { useEffect, useRef, useState } from "react";
import { COUNT_MS, countAt } from "@/lib/count-tween";

/**
 * Nombor yang dikira naik/turun bila nilainya berubah (bukan semasa mula dipaparkan).
 * `prefers-reduced-motion`: terus ke nilai baharu.
 */
export function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  // Nilai terakhir yang dipaparkan: kiraan baharu bermula dari sini walaupun terganggu.
  const last = useRef(value);

  useEffect(() => {
    const start = last.current;
    if (start === value) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : COUNT_MS;
    let raf = 0;
    const begin = performance.now();
    const step = (now: number) => {
      const t = duration ? (now - begin) / duration : 1;
      last.current = countAt(start, value, t);
      setShown(last.current);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{shown}</>;
}
