"use client";

import { Info, X } from "@phosphor-icons/react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { IPU_CATEGORIES, type IpuCategoryKey } from "@/lib/ipu";
import { LEVEL_ADVICE, levelRange, scalePosition } from "@/lib/ipu-scale";
import { useI18n } from "@/lib/use-i18n";
import { useMediaQuery } from "@/lib/use-media-query";

const COACH_KEY = "hezy:coach-skala";
const COACH_EVENT = "hezy-coach-skala";

function coachSeen(): boolean {
  try {
    return window.localStorage.getItem(COACH_KEY) === "1";
  } catch {
    return true;
  }
}

function markCoachSeen() {
  try {
    window.localStorage.setItem(COACH_KEY, "1");
  } catch {
    // Storan disekat: petunjuk ditutup untuk sesi ini sahaja.
  }
  window.dispatchEvent(new Event(COACH_EVENT));
}

const subscribeCoach = (listener: () => void) => {
  window.addEventListener(COACH_EVENT, listener);
  return () => window.removeEventListener(COACH_EVENT, listener);
};

/**
 * Pil kategori IPU yang boleh diketik untuk membuka helaian skala (5 tahap, tahap semasa
 * ditanda). Petunjuk sekali sahaja: `IpuScaleCoach`.
 */
export function IpuScaleButton({
  ipu,
  category,
  label,
}: {
  ipu: number;
  category: IpuCategoryKey;
  label: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  const openSheet = () => {
    markCoachSeen();
    setOpen(true);
  };

  return (
    <span className="relative inline-flex">
      <button
        ref={button}
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        data-testid="ipu-scale-button"
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${CATEGORY_STYLE[category].tint}`}
      >
        {label}
        <Info aria-hidden="true" size={15} weight="bold" />
        <span className="sr-only">{t("— lihat skala IPU")}</span>
      </button>
      {open && (
        <ScaleSheet
          ipu={ipu}
          category={category}
          label={label}
          onClose={() => {
            setOpen(false);
            button.current?.focus();
          }}
        />
      )}
    </span>
  );
}

function ScaleSheet({
  ipu,
  category,
  label,
  onClose,
}: {
  ipu: number;
  category: IpuCategoryKey;
  label: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const wide = useMediaQuery("(min-width: 768px)");
  const titleId = useId();
  const close = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const position = scalePosition(ipu);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Fokus ke butang Tutup sekali semasa dibuka; Escape menutup.
  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="sheet-backdrop fixed inset-0 z-50 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="ipu-scale-sheet"
        className={`bg-page text-ink fixed z-50 flex flex-col gap-3 p-5 ${
          wide
            ? "top-1/2 left-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] shadow-[0_16px_48px_rgb(0_0_0/0.25)]"
            : "sheet-up inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-[28px] pb-[max(env(safe-area-inset-bottom),20px)]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="font-display text-xl font-bold">
              {t("Skala IPU")}
            </h2>
            <p className="text-muted mt-0.5 text-sm">
              {t(
                "Sekarang {ipu} · {label}. Semakin tinggi nombor, semakin teruk jerebu.",
                { ipu, label },
              )}
            </p>
          </div>
          <button
            ref={close}
            type="button"
            onClick={onClose}
            aria-label={t("Tutup")}
            className="bg-surface hover:bg-line flex size-9 shrink-0 items-center justify-center rounded-full"
          >
            <X aria-hidden="true" size={16} weight="bold" />
          </button>
        </div>
        <div aria-hidden="true" className="relative my-1 flex h-2 gap-0.5">
          {IPU_CATEGORIES.map((c) => (
            <span
              key={c.key}
              className="flex-1 first:rounded-l-full last:rounded-r-full"
              style={{ background: CATEGORY_STYLE[c.key].accent }}
            />
          ))}
          <span
            data-testid="ipu-scale-marker"
            className="bg-ink absolute -top-1.5 h-5 w-1 -translate-x-1/2 rounded-full shadow-[0_0_0_2px_var(--page)]"
            style={{ left: `${position * 100}%` }}
          />
        </div>
        <ul className="flex flex-col gap-1.5">
          {IPU_CATEGORIES.map((c, i) => {
            const here = c.key === category;
            return (
              <li
                key={c.key}
                aria-current={here ? "true" : undefined}
                className={`grid grid-cols-[1fr_auto] gap-x-3 rounded-xl px-3.5 py-2.5 ${CATEGORY_STYLE[c.key].tint}`}
                style={
                  here
                    ? { boxShadow: `0 0 0 2px ${CATEGORY_STYLE[c.key].accent}` }
                    : undefined
                }
              >
                <span className="text-sm font-bold">
                  {t(c.label)}
                  {here && (
                    <span className="ml-2 rounded-full bg-black/75 px-1.5 py-px align-[1px] text-[10px] font-extrabold text-white">
                      {t("ANDA")}
                    </span>
                  )}
                </span>
                <span className="text-sm font-bold tabular-nums">
                  {levelRange(i)}
                </span>
                <span className="col-span-2 text-xs opacity-85">
                  {t(LEVEL_ADVICE[c.key])}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-muted text-xs">
          {t("Sumber rasmi: APIMS, Jabatan Alam Sekitar.")}
        </p>
      </div>
    </>
  );
}

/**
 * Petunjuk sekali sahaja di bawah nombor IPU (dalam aliran kandungan, tidak menindih
 * butang lain): kategori boleh diketik untuk melihat skala. Hilang bila "Faham" atau
 * pil diketik.
 */
export function IpuScaleCoach({
  label,
  compact = false,
}: {
  label: string;
  /** Desktop: satu baris pendek supaya kotak IPU hampir tidak berubah tinggi. */
  compact?: boolean;
}) {
  const { t } = useI18n();
  const seen = useSyncExternalStore(subscribeCoach, coachSeen, () => true);
  if (seen) return null;
  if (compact)
    return (
      <div
        role="status"
        data-testid="ipu-scale-coach"
        className="text-muted flex items-center gap-2 text-[13px] font-semibold"
      >
        <Info aria-hidden="true" size={16} weight="bold" className="shrink-0" />
        <span className="min-w-0">
          {t("Ketik “{label}” untuk lihat skala IPU", { label })}
        </span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={markCoachSeen}
          className="text-ink min-h-8 shrink-0 font-bold underline underline-offset-2"
        >
          {t("Faham")}
        </button>
      </div>
    );
  return (
    <div
      role="status"
      data-testid="ipu-scale-coach"
      className="bg-ink text-page flex items-center gap-3 rounded-2xl py-2.5 pr-2.5 pl-3.5 text-[13px] leading-snug"
    >
      <Info aria-hidden="true" size={18} weight="bold" className="shrink-0" />
      <span className="min-w-0 flex-1">
        <b>{t("Apa maksud nombor ini?")}</b>{" "}
        {t(
          "Ketik “{label}” untuk melihat skala IPU dan kedudukan bacaan anda.",
          {
            label,
          },
        )}
      </span>
      <button
        type="button"
        onClick={markCoachSeen}
        className="min-h-9 shrink-0 rounded-full bg-white/15 px-3.5 text-xs font-bold"
      >
        {t("Faham")}
      </button>
    </div>
  );
}
