"use client";

import { useState } from "react";
import { GEO_ERROR_MESSAGE, requestPosition } from "@/lib/geolocation";
import { areaToLocation, gpsToLocation } from "@/lib/locations";
import { updatePrefs } from "@/lib/prefs";
import { useI18n } from "@/lib/use-i18n";
import { LocationSearch } from "./location-search";

/** Butang GPS + carian kawasan untuk memilih lokasi semasa. */
export function ChooseLocation({ onChosen }: { onChosen?: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function useGps() {
    setBusy(true);
    setError(null);
    const result = await requestPosition();
    setBusy(false);
    if (!result.ok) {
      setError(t(GEO_ERROR_MESSAGE[result.reason]));
      return;
    }
    const current = await gpsToLocation(result.lat, result.lon);
    updatePrefs((p) => ({ ...p, current }));
    onChosen?.();
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={useGps}
        disabled={busy}
        className="bg-ink text-page flex min-h-13 items-center justify-center gap-2 rounded-2xl px-5 font-semibold disabled:opacity-60"
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        >
          <polygon points="3 11 21 3 13 21 11 13 3 11" />
        </svg>
        {busy ? t("Mengesan lokasi…") : t("Guna lokasi saya")}
      </button>
      {error && (
        <p
          role="alert"
          className="text-ipu-berbahaya-ink dark:text-ipu-berbahaya-tint text-sm font-semibold"
        >
          {error}
        </p>
      )}
      <p className="text-muted text-center text-xs font-semibold tracking-wide">
        {t("ATAU PILIH KAWASAN")}
      </p>
      <LocationSearch
        onPick={(area) => {
          updatePrefs((p) => ({ ...p, current: areaToLocation(area) }));
          onChosen?.();
        }}
      />
    </div>
  );
}
