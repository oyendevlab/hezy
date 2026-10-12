"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/use-i18n";
import { refreshReadings } from "@/lib/use-reading";

const isTyping = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
  );
};

/** Butang ⟳ muat semula (desktop) dengan pintasan papan kekunci R. */
export function RefreshButton({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  // Ref (bukan state dalam closure) supaya kekunci R tidak diabaikan sejurus selepas muat semula.
  const running = useRef(false);

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await refreshReadings();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "r" || e.metaKey || e.ctrlKey || e.altKey)
        return;
      if (isTyping(e.target)) return;
      e.preventDefault();
      void run();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={busy}
      aria-keyshortcuts="R"
      title={t("Muat semula (R)")}
      className={`border-line hover:bg-surface min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold disabled:opacity-60 ${className}`}
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={busy ? "animate-spin motion-reduce:animate-none" : undefined}
      >
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <polyline points="21 3 21 9 15 9" />
      </svg>
      {busy ? t("Memuat semula…") : t("Muat semula")}
    </button>
  );
}
