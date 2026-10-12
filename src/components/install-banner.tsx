"use client";

import { DeviceMobile, X } from "@phosphor-icons/react";
import { useId, useState, useSyncExternalStore } from "react";
import { useInstallStatus } from "@/lib/install";
import { useI18n } from "@/lib/use-i18n";
import { IosInstallSteps } from "./install-guide";

const KEY = "hezy:install-banner";
/** Banner tidak dipaparkan semula selama 14 hari selepas ditutup. */
export const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
const EVENT = "hezy-install-banner";

function dismissedRecently(): boolean {
  try {
    const at = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(at) && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

const subscribe = (listener: () => void) => {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
};

/**
 * Banner "Pasang Hezy" di Utama untuk Safari iPhone/iPad yang belum memasang Hezy
 * (amaran, lencana dan tarik-muat-semula hanya berfungsi selepas dipasang).
 */
export function InstallBanner({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const status = useInstallStatus();
  const hidden = useSyncExternalStore(subscribe, dismissedRecently, () => true);
  const [guide, setGuide] = useState(false);
  const stepsId = useId();
  if (status !== "ios" || hidden) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(KEY, String(Date.now()));
    } catch {
      // Storan disekat: banner ditutup untuk sesi ini sahaja.
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <section
      aria-labelledby={`${stepsId}-tajuk`}
      className={`bg-surface rounded-[22px] p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="bg-page flex size-10 shrink-0 items-center justify-center rounded-full">
          <DeviceMobile aria-hidden="true" size={22} weight="duotone" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`${stepsId}-tajuk`} className="text-[15px] font-bold">
            {t("Pasang Hezy di skrin utama")}
          </h2>
          <p className="text-muted text-xs font-medium">
            {t("Untuk amaran IPU, lencana ikon dan akses pantas")}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("Tutup banner pasang")}
          className="hover:bg-line -mt-1 -mr-1 flex size-10 shrink-0 items-center justify-center rounded-full"
        >
          <X aria-hidden="true" size={18} weight="bold" />
        </button>
      </div>
      <button
        type="button"
        aria-expanded={guide}
        aria-controls={stepsId}
        onClick={() => setGuide((g) => !g)}
        className="bg-ink text-page mt-3 min-h-11 w-full rounded-xl text-sm font-semibold"
      >
        {guide ? t("Tutup panduan") : t("Cara pasang")}
      </button>
      {guide && <IosInstallSteps id={stepsId} />}
    </section>
  );
}
