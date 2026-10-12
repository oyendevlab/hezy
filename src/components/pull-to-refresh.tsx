"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/use-i18n";
import { refreshReadings } from "@/lib/use-reading";
import { Logo } from "./logo";
import { crossedThreshold, hapticTick } from "@/lib/rubber-band";

/** Jarak tarikan (selepas redaman) untuk mencetuskan muat semula. */
const THRESHOLD = 64;
const MAX_PULL = 96;
/** Penunjuk kekal sekurang-kurangnya selama ini supaya pengguna nampak ia berlaku. */
const MIN_SPIN_MS = 600;

/** Elemen yang mengendalikan sentuhan sendiri (peta, graf boleh leret). */
const IGNORE = ".leaflet-container, [data-no-pull]";

/**
 * Tarik ke bawah di bahagian atas halaman untuk muat semula bacaan (skrin sentuh).
 * Penting dalam aplikasi yang dipasang di iOS, yang tiada tarik-muat-semula asli.
 */
export function PullToRefresh({
  onRefresh = refreshReadings,
}: {
  onRefresh?: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const state = useRef({ startY: 0, tracking: false, pull: 0, busy: false });
  const refreshRef = useRef(onRefresh);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const s = state.current;
    const root = document.documentElement;
    // Matikan tarik-muat-semula asli pelayar supaya tidak berganda.
    const previous = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = "contain";

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
      const next = Math.min(dy * 0.5, MAX_PULL);
      if (crossedThreshold(s.pull, next, THRESHOLD)) hapticTick();
      update(next);
    };

    const onEnd = async () => {
      if (!s.tracking) return;
      s.tracking = false;
      setDragging(false);
      if (s.pull < THRESHOLD) {
        update(0);
        return;
      }
      s.busy = true;
      setRefreshing(true);
      update(THRESHOLD * 0.8);
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

  const progress = Math.min(pull / THRESHOLD, 1);
  return (
    <>
      <div
        aria-hidden="true"
        data-testid="pull-indicator"
        data-state={refreshing ? "refreshing" : pull > 0 ? "pulling" : "idle"}
        className="pointer-events-none fixed top-0 left-1/2 z-30 flex size-11 items-center justify-center rounded-full bg-white shadow-lg"
        style={{
          transform: `translate(-50%, ${pull - 52}px)`,
          opacity: pull > 0 ? Math.max(progress, 0.3) : 0,
          transition: dragging
            ? "none"
            : "transform 200ms ease, opacity 200ms ease",
          marginTop: "env(safe-area-inset-top)",
        }}
      >
        <span
          className={
            refreshing ? "animate-spin motion-reduce:animate-none" : undefined
          }
          style={
            refreshing
              ? undefined
              : { transform: `rotate(${progress * 270}deg)` }
          }
        >
          <Logo size={28} />
        </span>
      </div>
      <span role="status" className="sr-only">
        {refreshing ? t("Memuat semula…") : ""}
      </span>
    </>
  );
}
