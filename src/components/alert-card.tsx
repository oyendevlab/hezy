"use client";

import { BellRinging, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  alertLocations,
  effectiveThreshold,
  pushOptions,
  type Prefs,
} from "@/lib/prefs";
import {
  currentSubscription,
  enablePush,
  pushSupport,
} from "@/lib/push-client";
import { useI18n } from "@/lib/use-i18n";

const SNOOZE_KEY = "hezy:kad-amaran";
const VISITS_KEY = "hezy:lawatan";
const SESSION_KEY = "hezy:sesi";
/** "Nanti": kad tidak dipaparkan semula selama 14 hari. */
export const ALERT_CARD_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
/** Pengesahan "Amaran dihidupkan" hilang sendiri selepas ini (v0.7.2). */
export const ALERT_CARD_CONFIRM_MS = 5000;
/** Tempoh animasi kad mengecil dan memudar. */
const LEAVE_MS = 320;

/** Kira lawatan sekali bagi setiap sesi pelayar; memulangkan jumlah lawatan. */
function countVisit(): number {
  try {
    let visits = Number(window.localStorage.getItem(VISITS_KEY)) || 0;
    if (!window.sessionStorage.getItem(SESSION_KEY)) {
      window.sessionStorage.setItem(SESSION_KEY, "1");
      visits += 1;
      window.localStorage.setItem(VISITS_KEY, String(visits));
    }
    return visits;
  } catch {
    return 1;
  }
}

function snoozed(): boolean {
  try {
    const at = Number(window.localStorage.getItem(SNOOZE_KEY));
    return Number.isFinite(at) && Date.now() - at < ALERT_CARD_SNOOZE_MS;
  } catch {
    return true;
  }
}

/**
 * Kad "Hidupkan amaran" pada saat relevan: bila IPU melebihi 100 atau pada lawatan kedua,
 * hanya jika pelayar menyokong notifikasi dan belum melanggan. (Safari iPhone yang belum
 * memasang Hezy diberi panduan oleh banner Pasang Hezy.)
 */
export function AlertCard({ prefs, ipu }: { prefs: Prefs; ipu: number }) {
  const { t } = useI18n();
  const [eligible, setEligible] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "on" | "denied">("idle");
  const [leaving, setLeaving] = useState(false);
  const unhealthy = ipu > 100;

  // Selepas amaran dihidupkan: pengesahan hilang sendiri (atau bila X ditekan).
  useEffect(() => {
    if (state !== "on") return;
    const timer = setTimeout(() => setLeaving(true), ALERT_CARD_CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [state]);
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setEligible(false), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  useEffect(() => {
    let cancelled = false;
    const visits = countVisit();
    if (pushSupport() !== "supported" || snoozed()) return;
    if (!unhealthy && visits < 2) return;
    void currentSubscription()
      .then((sub) => {
        if (!cancelled && !sub) setEligible(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [unhealthy]);

  if (!eligible || !prefs.current) return null;

  const later = () => {
    try {
      window.localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    } catch {
      // Storan disekat: kad ditutup untuk sesi ini sahaja.
    }
    setEligible(false);
  };

  async function enable() {
    setState("busy");
    try {
      const result = await enablePush(
        alertLocations(prefs),
        effectiveThreshold(prefs),
        prefs.lang,
        pushOptions(prefs),
      );
      setState(result === "enabled" ? "on" : "denied");
    } catch {
      setState("denied");
    }
  }

  return (
    // Mengecil (grid 1fr → 0fr) dan memudar bila kad ditutup.
    <div
      data-state={leaving ? "leaving" : "shown"}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
        leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      }`}
    >
      <section
        data-testid="alert-card"
        aria-labelledby="kad-amaran-tajuk"
        className="bg-ipu-tidak-sihat-tint text-ipu-tidak-sihat-ink flex min-h-0 flex-col gap-2.5 overflow-hidden rounded-[20px] p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="kad-amaran-tajuk" className="text-[15px] font-bold">
            {state === "on"
              ? t("Amaran dihidupkan")
              : t("Mahu diberitahu bila jerebu teruk?")}
          </h2>
          {state === "on" && (
            <button
              type="button"
              onClick={() => setLeaving(true)}
              aria-label={t("Tutup")}
              className="-my-1.5 -mr-1.5 flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
            >
              <X aria-hidden="true" size={16} weight="bold" />
            </button>
          )}
        </div>
        <p className="text-sm leading-snug">
          {state === "on"
            ? t("Anda boleh menukar ambang dan rutin amaran di Tetapan.")
            : t(
                "Hezy akan menghantar notifikasi bila IPU {name} melepasi {threshold}.",
                {
                  name: t(prefs.current.name),
                  threshold: effectiveThreshold(prefs),
                },
              )}
        </p>
        {state === "denied" && (
          <p role="alert" className="text-sm font-semibold">
            {t(
              "Kebenaran notifikasi ditolak. Benarkan notifikasi untuk Hezy dalam tetapan pelayar.",
            )}
          </p>
        )}
        {state !== "on" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void enable()}
              disabled={state === "busy"}
              className="bg-ipu-tidak-sihat-ink text-ipu-tidak-sihat-tint flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-60"
            >
              <BellRinging aria-hidden="true" size={18} weight="fill" />
              {t("Hidupkan amaran")}
            </button>
            <button
              type="button"
              onClick={later}
              className="min-h-11 flex-1 rounded-xl bg-white/55 text-sm font-bold"
            >
              {t("Nanti")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
