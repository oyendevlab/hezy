import { useRef, useState } from "react";

/**
 * Pilih satu jam pada graf dengan sentuh/leret, tetikus atau papan kekunci.
 * Selagi pengguna belum memilih, pilihan mengikut `defaultIndex` (jam semasa).
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

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      dragging.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      fromPointer(e);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      // Tetikus: ikut kursor; sentuh/pen: hanya semasa leret.
      if (dragging.current || e.pointerType === "mouse") fromPointer(e);
    },
    onPointerUp: () => {
      dragging.current = false;
    },
    onPointerCancel: () => {
      dragging.current = false;
    },
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
      if (next === null) return;
      e.preventDefault();
      setChosen(clamp(next));
    },
  };

  return {
    index,
    /** Pengguna telah memilih jam selain jam semasa. */
    moved: chosen !== null && index !== defaultIndex,
    reset: () => setChosen(null),
    handlers,
  };
}
