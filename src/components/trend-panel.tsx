"use client";

import { CATEGORY_STYLE } from "@/lib/category-style";
import { formatDay, formatHour, formatWindow } from "@/lib/format";
import { ipuCategory } from "@/lib/ipu";
import { displayIpu } from "@/lib/official";
import type { HourPoint, Reading } from "@/lib/reading";
import { useI18n } from "@/lib/use-i18n";
import { HourBars } from "./hour-bars";

function average(hours: HourPoint[], from: number, to: number): number | null {
  const values = hours
    .filter((h) => {
      const hour = Number(h.time.slice(11, 13));
      return hour >= from && hour < to;
    })
    .map(displayIpu)
    .filter((v): v is number => v !== null);
  return values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : null;
}

/** Masa terbaik keluar + graf 24 jam + purata pagi/petang/malam (mockup G). */
export function TrendPanel({
  reading,
  barHeight = 150,
}: {
  reading: Reading;
  barHeight?: number;
}) {
  const { t, lang } = useI18n();
  const { today, bestWindow } = reading;
  // Bacaan lama dalam cache peranti mungkin belum mempunyai medan days.
  const days = reading.days ?? [];
  const todayDate = today[0]?.time.slice(0, 10) ?? "";
  const lastPast = today.findLast((h) => !h.forecast);
  const bestCategory = bestWindow ? ipuCategory(bestWindow.averageIpu) : null;
  const blocks = [
    { name: t("Pagi"), span: t("6 pg – 12 tgh"), value: average(today, 6, 12) },
    {
      name: t("Petang"),
      span: t("12 tgh – 6 ptg"),
      value: average(today, 12, 18),
    },
    {
      name: t("Malam"),
      span: t("6 ptg – 12 mlm"),
      value: average(today, 18, 24),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {bestWindow && bestCategory && (
        <div
          className={`rounded-[22px] p-4.5 ${CATEGORY_STYLE[bestCategory.key].tint}`}
        >
          <div className="text-[13px] font-bold tracking-wide">
            {t("MASA TERBAIK UNTUK KELUAR")}
          </div>
          <div className="font-display mt-1 text-[34px] leading-tight font-bold">
            {formatWindow(bestWindow.start, bestWindow.end, todayDate, lang)}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {t("Anggaran IPU ~{ipu} · {label}", {
              ipu: bestWindow.averageIpu,
              label: t(bestCategory.label),
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-bold">
            {t("Hari ini, jam demi jam")}
          </h2>
          {lastPast && (
            <span className="text-muted text-xs font-semibold">
              {t("Selepas {time}: ramalan", {
                time: formatHour(lastPast.time, lang),
              })}
            </span>
          )}
        </div>
        <div className="mt-3">
          <HourBars hours={today} height={barHeight} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {blocks.map((b) => (
          <div key={b.name} className="bg-surface rounded-2xl p-3">
            <div className="text-sm font-bold">{b.name}</div>
            <div className="text-muted text-[11px] font-medium">{b.span}</div>
            <div className="font-display mt-1 text-2xl font-bold">
              {b.value ?? "–"}
            </div>
            <div
              className="mt-1 h-1.5 rounded-full"
              style={{
                background:
                  b.value === null
                    ? "var(--line)"
                    : CATEGORY_STYLE[ipuCategory(b.value).key].accent,
              }}
            />
          </div>
        ))}
      </div>

      {days.length > 0 && (
        <section aria-labelledby="ramalan-3-hari">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="ramalan-3-hari" className="font-display text-xl font-bold">
              {t("Ramalan 3 hari")}
            </h2>
            <span className="text-muted text-xs font-semibold">
              {t("Anggaran")}
            </span>
          </div>
          <ul className="mt-3 grid grid-cols-3 gap-2.5">
            {days.map((d) => (
              <li key={d.date} className="bg-surface rounded-2xl p-3">
                <div className="text-sm font-bold">
                  {formatDay(d.date, todayDate, lang)}
                </div>
                <div className="font-display text-2xl font-bold">
                  {d.averageIpu}
                </div>
                <div className="text-muted text-[11px] font-medium">
                  {t("Purata · maks {max}", { max: d.maxIpu })}
                </div>
                <div
                  className="mt-1 h-1.5 rounded-full"
                  style={{
                    background:
                      CATEGORY_STYLE[ipuCategory(d.averageIpu).key].accent,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-muted text-xs">
        {reading.correction
          ? t(
              "Jam lepas menggunakan bacaan rasmi APIMS stesen {station}. Ramalan model (PM2.5, formula JAS) dibetulkan dengan bacaan itu: {offset} µg/m³ pada jam semasa, berkurang ke model dalam 48 jam.",
              {
                station: reading.official?.stationName ?? "terdekat",
                offset: `${reading.correction.offsetPm25 >= 0 ? "+" : ""}${Math.round(reading.correction.offsetPm25)}`,
              },
            )
          : t(
              "Jam lepas dan purata menggunakan bacaan rasmi APIMS stesen terdekat jika ada. Ramalan dan masa terbaik menggunakan IPU sejam daripada PM2.5 model (formula JAS).",
            )}
      </p>
    </div>
  );
}
