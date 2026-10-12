"use client";

import { useEffect, useRef, useState } from "react";
import { PULL_THRESHOLD, rubberBand } from "@/lib/rubber-band";
import { useI18n } from "@/lib/use-i18n";
import { refreshReadings } from "@/lib/use-reading";
import { Logo } from "./logo";

/** Penunjuk kekal sekurang-kurangnya selama ini supaya pengguna nampak ia berlaku. */
const MIN_SPIN_MS = 700;
/** Lantunan dengan sedikit lajakan. */
const SPRING = "transform 520ms cubic-bezier(.34,1.56,.64,1)";
const IGNORE = ".leaflet-container, [data-no-pull]";

/**
 * Kad putih Utama (telefon) yang boleh ditarik ke bawah seperti getah untuk muat semula.
 * Langit tetap di belakang; hanya kad bergerak. Lepas sebelum ambang → melantun semula;
 * selepas ambang → berhenti, awan berputar di ruang langit, kemudian melantun bila siap.
 */
export function ElasticCard({
  children,
  className = "",
  onRefresh = refreshReadings,
}: {
  children: React.ReactNode;
  className?: string;
  onRefresh?: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const state = useRef({ startY: 0, tracking: false, pull: 0, busy: false });
  const refreshRef = useRef(onRefresh);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const s = state.current;
    const root = document.documentElement;
    const previous = root.style.overscrollBehaviorY;
    // Matikan tarik-muat-semula asli pelayar supaya tidak berganda.
    root.style.overscrollBehaviorY = "contain";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = (value: number) => {
      s.pull = value;
      setPull(value);
    };
    const onStart = (e: TouchEvent) => {
      const target = e.target as Element | null;
      s.tracking =
        !s.busy &&
        e.touches.length === 1 &&
        window.scrollY <= 0 &&
        !target?.closest(IGNORE);
      s.startY = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (!s.tracking) return;
      const dy = e.touches[0].clientY - s.startY;
      if (dy <= 0 || window.scrollY > 0) {
        if (s.pull) update(0);
        return;
      }
      if (e.cancelable) e.preventDefault();
      setDragging(true);
      update(rubberBand(dy));
    };
    const onEnd = async () => {
      if (!s.tracking) return;
      s.tracking = false;
      setDragging(false);
      if (s.pull < PULL_THRESHOLD) {
        update(0);
        return;
      }
      s.busy = true;
      setRefreshing(true);
      update(reduce.matches ? 0 : PULL_THRESHOLD);
      const minDelay = new Promise((r) => setTimeout(r, MIN_SPIN_MS));
      try {
        await Promise.all([refreshRef.current(), minDelay]);
      } finally {
        s.busy = false;
        setRefreshing(false);
        update(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      root.style.overscrollBehaviorY = previous;
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const progress = Math.min(pull / PULL_THRESHOLD, 1);
  const transition = dragging ? "none" : SPRING;
  return (
    <div className="relative">
      {/* Awan berputar di ruang langit yang terbuka di atas kad. */}
      <div
        aria-hidden="true"
        data-testid="pull-indicator"
        data-state={refreshing ? "refreshing" : pull > 0 ? "pulling" : "idle"}
        className="pointer-events-none absolute left-1/2 z-0 flex size-11 items-center justify-center rounded-full bg-white/80 shadow-md"
        style={{
          top: 0,
          transform: `translate(-50%, ${pull / 2 - 22}px) scale(${0.6 + 0.4 * progress})`,
          opacity: pull > 4 || refreshing ? Math.max(progress, 0.4) : 0,
          transition: dragging ? "none" : `${SPRING}, opacity 200ms ease`,
        }}
      >
        <span
          className={
            refreshing ? "animate-spin motion-reduce:animate-none" : undefined
          }
          style={
            refreshing
              ? undefined
              : { transform: `rotate(${progress * 300}deg)` }
          }
        >
          <Logo size={28} />
        </span>
      </div>
      <div
        data-testid="elastic-card"
        className={`relative z-10 motion-reduce:!transition-none ${className}`}
        style={{ transform: `translateY(${pull}px)`, transition }}
      >
        {children}
      </div>
      <span role="status" className="sr-only">
        {refreshing ? t("Memuat semula…") : ""}
      </span>
    </div>
  );
}
