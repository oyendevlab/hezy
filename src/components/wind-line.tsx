"use client";

import { useI18n } from "@/lib/use-i18n";
import { CALM_KMH, type Compass, type Wind } from "@/lib/wind";

const COMPASS_LABEL: Record<Compass, string> = {
  utara: "utara",
  "timur-laut": "timur laut",
  timur: "timur",
  tenggara: "tenggara",
  selatan: "selatan",
  "barat-daya": "barat daya",
  barat: "barat",
  "barat-laut": "barat laut",
};

/** Anak panah menunjuk ke arah angin bertiup (arah datang + 180°). */
export function WindArrow({
  direction,
  size = 16,
}: {
  direction: number;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${direction + 180}deg)` }}
      className="shrink-0"
    >
      <line x1="12" y1="20" x2="12" y2="4" />
      <polyline points="6 10 12 4 18 10" />
    </svg>
  );
}

export function useWindText() {
  const { t } = useI18n();
  return (wind: Wind) => {
    if (wind.speed < CALM_KMH) return t("Angin tenang");
    const compass = t(COMPASS_LABEL[wind.compass]);
    return wind.source
      ? t("Angin dari {compass} (arah {source}) · {speed} km/j", {
          compass,
          source: t(wind.source === "sumatera" ? "Sumatera" : "Kalimantan"),
          speed: wind.speed,
        })
      : t("Angin dari {compass} · {speed} km/j", {
          compass,
          speed: wind.speed,
        });
  };
}

/** Baris ringkas angin dan asal jerebu di skrin Utama. */
export function WindLine({ wind }: { wind: Wind }) {
  const { t } = useI18n();
  const text = useWindText()(wind);
  const hotspotNote =
    wind.hotspots != null && wind.speed >= CALM_KMH
      ? wind.hotspots > 0
        ? t("· {n} titik panas di hulu angin (2 hari, NASA FIRMS)", {
            n: wind.hotspots.toLocaleString("ms-MY"),
          })
        : t("· tiada titik panas dikesan di hulu angin (2 hari)")
      : wind.source
        ? t("· kawasan kebakaran biasa di hulu angin")
        : null;
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-sm font-semibold">
      {wind.speed >= CALM_KMH && <WindArrow direction={wind.direction} />}
      <span>{text}</span>
      {hotspotNote && (
        <span className="text-muted text-xs font-medium">{hotspotNote}</span>
      )}
    </p>
  );
}
