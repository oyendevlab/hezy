"use client";

import { X } from "@phosphor-icons/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/use-i18n";
import { useMediaQuery } from "@/lib/use-media-query";

/** Tempoh animasi tutup (selaras dengan .sheet-down / .dialog-out dalam globals.css). */
export const SHEET_CLOSE_MS = 220;
/** Tarikan ke bawah melebihi ini (px) menutup helaian. */
const DRAG_CLOSE = 110;

const SheetContext = createContext<() => void>(() => {});

/** Tutup helaian semasa dengan animasi (cth. selepas memilih sesuatu dalam helaian). */
export const useSheetDismiss = () => useContext(SheetContext);

/**
 * Helaian bersama (v0.7.2): telefon = helaian bawah yang meluncur naik, dan meluncur turun
 * bila ditutup (X, latar, Escape) atau ditarik ke bawah dengan jari; desktop = dialog di
 * tengah yang memudar. `onClose` dipanggil selepas animasi tutup. Kandungan boleh menutup
 * helaian dengan animasi melalui `useSheetDismiss()`.
 */
export function BottomSheet({
  title,
  description,
  eyebrow,
  onClose,
  testId,
  children,
  className = "",
  bare = false,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Label kecil di atas tajuk, cth. "STATUS SEKOLAH". */
  eyebrow?: React.ReactNode;
  onClose: () => void;
  testId?: string;
  children: React.ReactNode;
  className?: string;
  /** Tanpa pengepala lalai (kandungan menyediakan tajuknya sendiri; `title` jadi label). */
  bare?: boolean;
}) {
  const { t } = useI18n();
  const wide = useMediaQuery("(min-width: 768px)");
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef({ startY: 0, active: false, value: 0 });

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const closingRef = useRef(false);
  const dismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setTimeout(() => onCloseRef.current(), reduce ? 0 : SHEET_CLOSE_MS);
  }, []);

  // Fokus ke dalam helaian semasa dibuka; Escape menutup; Tab berpusing dalam helaian.
  useEffect(() => {
    const node = panel.current;
    node
      ?.querySelector<HTMLElement>("[data-autofocus], button, a, input")
      ?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = [
        ...node.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], input, select",
        ),
      ];
      const first = items[0];
      const last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dismiss]);

  // Tarik ke bawah untuk tutup (telefon): bermula dari mana-mana bahagian helaian bila
  // kandungannya di atas sekali, supaya tatalan dalam helaian tidak terganggu.
  const onTouchStart = (e: React.TouchEvent) => {
    if (wide || closing || (panel.current?.scrollTop ?? 0) > 0) return;
    if ((e.target as Element).closest("[data-no-sheet-drag]")) return;
    dragState.current = {
      startY: e.touches[0].clientY,
      active: true,
      value: 0,
    };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = dragState.current;
    if (!s.active) return;
    const dy = e.touches[0].clientY - s.startY;
    if (dy <= 0) {
      if (s.value) {
        s.value = 0;
        setDrag(0);
      }
      return;
    }
    s.value = dy;
    setDragging(true);
    setDrag(dy);
  };
  const onTouchEnd = () => {
    const s = dragState.current;
    if (!s.active) return;
    s.active = false;
    setDragging(false);
    if (s.value > DRAG_CLOSE) dismiss();
    else setDrag(0);
  };

  return createPortal(
    <>
      <div
        aria-hidden="true"
        onClick={dismiss}
        className={`fixed inset-0 z-50 bg-black/40 ${closing ? "sheet-backdrop-out" : "sheet-backdrop"}`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
        data-state={closing ? "closing" : "open"}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        className={`bg-page text-ink fixed z-50 flex flex-col gap-3 ${
          wide
            ? `top-1/2 left-1/2 max-h-[85svh] w-[420px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[24px] p-5 shadow-[0_16px_48px_rgb(0_0_0/0.25)] ${closing ? "dialog-out" : "dialog-in"}`
            : `inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto overscroll-contain rounded-t-[28px] px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)] ${closing ? "sheet-down" : "sheet-up"}`
        } ${className}`}
        style={
          wide
            ? undefined
            : {
                transform: drag ? `translateY(${drag}px)` : undefined,
                transition: dragging
                  ? "none"
                  : "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)",
              }
        }
      >
        {!wide && (
          <div
            aria-hidden="true"
            data-testid="sheet-grabber"
            className="bg-line mx-auto mb-1 h-1.5 w-10 shrink-0 rounded-full"
          />
        )}
        {bare ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-muted text-xs font-bold tracking-wide">
                  {eyebrow}
                </p>
              )}
              <h2 id={titleId} className="font-display text-xl font-bold">
                {title}
              </h2>
              {description && (
                <p className="text-muted mt-0.5 text-sm">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label={t("Tutup")}
              data-autofocus
              className="bg-surface hover:bg-line flex size-9 shrink-0 items-center justify-center rounded-full"
            >
              <X aria-hidden="true" size={16} weight="bold" />
            </button>
          </div>
        )}
        <SheetContext value={dismiss}>{children}</SheetContext>
      </div>
    </>,
    document.body,
  );
}
