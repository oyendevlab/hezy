"use client";

import { Fire, Wind as WindIcon } from "@phosphor-icons/react";
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

/** Angin (ikon angin + anak panah arah tiupan) dan titik panas (ikon api) di skrin Utama. */
export function WindLine({ wind }: { wind: Wind }) {
  const { t } = useI18n();
  const text = useWindText()(wind);
  const moving = wind.speed >= CALM_KMH;
  const hotspots = moving ? wind.hotspots : null;
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        <WindIcon
          aria-hidden="true"
          size={20}
          weight="duotone"
          color="#3a7bd5"
          className="shrink-0"
        />
        {moving && <WindArrow direction={wind.direction} size={14} />}
        <span>{text}</span>
      </p>
      {hotspots != null ? (
        <p className="flex items-center gap-2 font-medium">
          <Fire
            aria-hidden="true"
            size={20}
            weight="duotone"
            color={hotspots > 0 ? "#e8731c" : "#8a857c"}
            className="shrink-0"
          />
          {hotspots > 0 ? (
            <span>
              <strong className="font-bold">
                {hotspots.toLocaleString("ms-MY")}
              </strong>{" "}
              {t("titik panas di hulu angin · 2 hari")}
            </span>
          ) : (
            <span className="text-muted">
              {t("Tiada titik panas dikesan di hulu angin · 2 hari")}
            </span>
          )}
        </p>
      ) : (
        wind.source && (
          <p className="text-muted flex items-center gap-2 font-medium">
            <Fire
              aria-hidden="true"
              size={20}
              weight="duotone"
              color="#8a857c"
              className="shrink-0"
            />
            {t("Kawasan kebakaran biasa di hulu angin")}
          </p>
        )
      )}
    </div>
  );
}
