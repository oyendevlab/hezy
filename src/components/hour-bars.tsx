"use client";

import { CATEGORY_STYLE } from "@/lib/category-style";
import { formatHour } from "@/lib/format";
import { ipuCategory } from "@/lib/ipu";
import { displayIpu } from "@/lib/official";
import type { HourPoint } from "@/lib/reading";
import { useI18n } from "@/lib/use-i18n";

const SCALE_MAX = 200;

/**
 * Graf bar IPU bagi hari ini (mockup G).
 * Jam lepas: IPU rasmi APIMS jika ada, jika tidak anggaran model. Jam akan datang: ramalan model (pudar).
 */
export function HourBars({
  hours,
  height = 150,
}: {
  hours: HourPoint[];
  height?: number;
}) {
  const { t, lang } = useI18n();
  const points = hours.map((h) => ({ ...h, value: displayIpu(h) }));
  const known = points.filter(
    (p): p is (typeof points)[number] & { value: number } => p.value !== null,
  );
  const nowIndex = hours.findLastIndex((h) => !h.forecast);
  const officialPast = hours.some((h) => !h.forecast && h.officialIpu != null);
  const peak = known.reduce<(typeof known)[number] | null>(
    (a, p) => (a && a.value >= p.value ? a : p),
    null,
  );
  const low = known.reduce<(typeof known)[number] | null>(
    (a, p) => (a && a.value <= p.value ? a : p),
    null,
  );
  const summary =
    peak && low
      ? t(
          "Graf IPU hari ini. Tertinggi {max} pada {maxTime}, terendah {min} pada {minTime}.",
          {
            max: peak.value,
            maxTime: formatHour(peak.time, lang),
            min: low.value,
            minTime: formatHour(low.time, lang),
          },
        )
      : t("Graf IPU hari ini. Data tidak mencukupi.");

  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={summary}
        className="flex items-end gap-[3px] md:gap-1"
        style={{ height }}
      >
        {points.map((p, i) => {
          const color =
            p.value === null
              ? "transparent"
              : CATEGORY_STYLE[ipuCategory(p.value).key].accent;
          const official = !p.forecast && p.officialIpu != null;
          return (
            <div
              key={p.time}
              title={
                p.value === null
                  ? undefined
                  : `${formatHour(p.time, lang)} · ${t("IPU {threshold}", { threshold: p.value })} (${t(p.forecast ? "ramalan" : official ? "rasmi" : "anggaran")})`
              }
              className={`flex-1 rounded-[4px] ${p.forecast ? "opacity-45" : ""} ${
                i === nowIndex ? "outline-ink outline-2 outline-offset-2" : ""
              }`}
              style={{
                height:
                  p.value === null
                    ? 4
                    : Math.max(
                        4,
                        Math.round(
                          (Math.min(p.value, SCALE_MAX) / SCALE_MAX) * height,
                        ),
                      ),
                background: p.value === null ? "var(--line)" : color,
              }}
            />
          );
        })}
      </div>
      <figcaption>
        <div className="text-muted mt-1.5 flex justify-between text-[11px] font-semibold md:text-xs">
          <span>{t("12 pg")}</span>
          <span>{t("6 pg")}</span>
          <span>{t("12 tgh")}</span>
          <span>{t("6 ptg")}</span>
          <span>{t("11 mlm")}</span>
        </div>
        <div className="text-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="bg-ink size-2.5 rounded-sm" />
            {t(
              officialPast
                ? "Jam lepas: bacaan rasmi APIMS"
                : "Jam lepas: anggaran model",
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="bg-ink size-2.5 rounded-sm opacity-45"
            />
            {t("Jam akan datang: ramalan model")}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}
