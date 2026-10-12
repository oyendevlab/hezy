"use client";

import { useId } from "react";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { formatHour } from "@/lib/format";
import { ipuCategory } from "@/lib/ipu";
import { displayIpu } from "@/lib/official";
import type { HourPoint } from "@/lib/reading";
import { useHourScrub } from "@/lib/use-hour-scrub";
import { useI18n } from "@/lib/use-i18n";
import { IpuPill } from "./ipu-pill";

const SCALE_MAX = 200;

/**
 * Graf bar IPU bagi hari ini (mockup G), boleh disentuh dan dileret untuk melihat nilai setiap jam.
 * Jam lepas: IPU rasmi APIMS jika ada, jika tidak anggaran model. Jam akan datang: ramalan model (pudar).
 */
export function HourBars({
  hours,
  height = 150,
  forecastError = null,
}: {
  hours: HourPoint[];
  height?: number;
  /** Ralat purata ramalan 14 hari (IPU), jika ada. */
  forecastError?: number | null;
}) {
  const { t, lang } = useI18n();
  const points = hours.map((h) => ({ ...h, value: displayIpu(h) }));
  const known = points.filter(
    (p): p is (typeof points)[number] & { value: number } => p.value !== null,
  );
  const nowIndex = hours.findLastIndex((h) => !h.forecast);
  const officialPast = hours.some((h) => !h.forecast && h.officialIpu != null);
  const correctedFuture = hours.some((h) => h.forecast && h.corrected);
  const scrub = useHourScrub(points.length, nowIndex);
  const summaryId = useId();
  const selected = scrub.index >= 0 ? points[scrub.index] : null;

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

  const sourceOf = (p: (typeof points)[number]) =>
    p.forecast
      ? p.corrected
        ? t("Ramalan dibetulkan")
        : t("Ramalan model")
      : p.officialIpu != null
        ? t("Bacaan rasmi APIMS")
        : p.corrected
          ? t("Anggaran dibetulkan")
          : t("Anggaran model");
  const valueText = selected
    ? selected.value === null
      ? `${formatHour(selected.time, lang)}: ${t("Tiada data")}`
      : `${formatHour(selected.time, lang)}: ${t("IPU {ipu}, {label}", {
          ipu: selected.value,
          label: t(ipuCategory(selected.value).label),
        })} · ${sourceOf(selected)}`
    : "";

  return (
    <figure className="m-0">
      {selected && (
        // Tinggi dan lebar tetap supaya baris tidak melompat semasa graf diseret.
        <div
          aria-hidden="true"
          className="mb-3 flex h-12 items-center gap-3 overflow-hidden whitespace-nowrap"
        >
          <div className="flex w-[6.75rem] shrink-0 flex-col leading-tight">
            <span
              className={`text-[11px] font-bold tracking-[0.12em] ${scrub.index === nowIndex ? "text-ink" : "text-muted"}`}
            >
              {scrub.index === nowIndex ? t("KINI") : t("JAM LAIN")}
            </span>
            <span className="text-sm font-bold">
              {formatHour(selected.time, lang)}
            </span>
          </div>
          {selected.value === null ? (
            <span className="text-muted text-sm">{t("Tiada data")}</span>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-display w-[3.2ch] text-right text-[28px] leading-none font-bold tabular-nums">
                {selected.value}
              </span>
              <IpuPill
                category={ipuCategory(selected.value).key}
                label={t(ipuCategory(selected.value).label)}
                className="!px-2 !py-0.5 !text-xs"
              />
            </div>
          )}
          <span className="text-muted ml-auto truncate text-xs font-semibold">
            {t(
              selected.forecast
                ? "Ramalan"
                : selected.officialIpu != null
                  ? "Rasmi APIMS"
                  : "Anggaran",
            )}
          </span>
        </div>
      )}
      <div
        role="slider"
        tabIndex={0}
        aria-label={t("Graf IPU hari ini, jam demi jam")}
        aria-describedby={summaryId}
        aria-valuemin={0}
        aria-valuemax={Math.max(points.length - 1, 0)}
        aria-valuenow={Math.max(scrub.index, 0)}
        aria-valuetext={valueText}
        data-no-pull
        {...scrub.handlers}
        className="focus-visible:outline-ink relative flex cursor-crosshair touch-pan-y items-end gap-[3px] rounded-md select-none focus-visible:outline-2 focus-visible:outline-offset-4 md:gap-1"
        style={{ height }}
      >
        {points.map((p, i) => {
          const color =
            p.value === null
              ? "transparent"
              : CATEGORY_STYLE[ipuCategory(p.value).key].accent;
          return (
            <div
              key={p.time}
              className={`flex-1 rounded-[4px] ${p.forecast ? "opacity-45" : ""} ${
                i === scrub.index
                  ? "outline-ink outline-2 outline-offset-2"
                  : ""
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
        {scrub.index >= 0 && (
          <span
            aria-hidden="true"
            className="border-ink pointer-events-none absolute -top-1 bottom-0 w-0 -translate-x-1/2 border-l-2 border-dashed opacity-45"
            style={{
              left: `${((scrub.index + 0.5) / points.length) * 100}%`,
            }}
          />
        )}
      </div>
      <figcaption>
        <p id={summaryId} className="sr-only">
          {summary}
        </p>
        <div className="text-muted mt-1.5 flex justify-between text-[11px] font-semibold md:text-xs">
          <span>{t("12 pg")}</span>
          <span>{t("6 pg")}</span>
          <span>{t("12 tgh")}</span>
          <span>{t("6 ptg")}</span>
          <span>{t("11 mlm")}</span>
        </div>
        <div className="text-muted mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold">
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
            {t(
              correctedFuture
                ? "Jam akan datang: ramalan dibetulkan dengan APIMS"
                : "Jam akan datang: ramalan model",
            )}
            {forecastError !== null &&
              ` (${t("biasanya ±{n}", { n: forecastError })})`}
          </span>
          <span className={scrub.active ? "invisible" : ""}>
            {t("Tekan dan seret graf untuk lihat jam lain")}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}
