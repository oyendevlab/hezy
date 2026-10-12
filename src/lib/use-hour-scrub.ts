import { useRef, useState } from "react";

/**
 * Tekan dan seret (sentuh atau tetikus) untuk melihat jam lain; lepas → kembali ke jam semasa
 * (`defaultIndex`). Papan kekunci: anak panah memilih jam; fokus beralih → kembali.
 */
export function useHourScrub(
  count: number,
  defaultIndex: number,
  /** Tukar kedudukan mendatar (0–1) kepada indeks; lalai: bahagian sama rata. */
  fracToIndex: (frac: number) => number = (frac) => Math.floor(frac * count),
) {
  const [chosen, setChosen] = useState<number | null>(null);
  const dragging = useRef(false);
  const clamp = (i: number) => Math.min(Math.max(i, 0), count - 1);
  const index =
    count === 0 ? -1 : clamp(chosen ?? (defaultIndex >= 0 ? defaultIndex : 0));

  const fromPointer = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || count === 0) return;
    setChosen(clamp(fracToIndex((e.clientX - rect.left) / rect.width)));
  };

  const release = () => {
    dragging.current = false;
    setChosen(null);
  };

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      dragging.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      fromPointer(e);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (dragging.current) fromPointer(e);
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: () => {
      if (dragging.current) release();
    },
    onBlur: () => setChosen(null),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      const step: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        PageUp: -6,
        PageDown: 6,
      };
      let next: number | null = null;
      if (e.key in step) next = index + step[e.key];
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = count - 1;
      else if (e.key === "Escape") {
        setChosen(null);
        return;
      }
      if (next === null) return;
      e.preventDefault();
      setChosen(clamp(next));
    },
  };

  return {
    index,
    /** Pengguna sedang melihat jam lain (seret atau papan kekunci). */
    active: chosen !== null,
    handlers,
  };
}
