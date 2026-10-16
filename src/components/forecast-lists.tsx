"use client";

import {
  CalendarDots,
  ChartBar,
  CloudRain,
  CloudSun,
  Drop,
  NavigationArrow,
  Thermometer,
  Wind,
} from "@phosphor-icons/react";
import { useState } from "react";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { formatDay, formatHour } from "@/lib/format";
import { ipuCategory } from "@/lib/ipu";
import type { DayForecast, HourForecast } from "@/lib/reading";
import { useI18n } from "@/lib/use-i18n";
import type { DayWeather } from "@/lib/weather";
import { InfoSheetButton } from "./info-sheet";
import { weatherLook } from "./weather-icon";

/** Anak panah arah angin bertiup (arah datang + 180°). */
function WindArrow({ from, size = 12 }: { from: number; size?: number }) {
  return (
    <NavigationArrow
      aria-hidden="true"
      size={size}
      weight="fill"
      // NavigationArrow menghala ke kiri atas (-45°); putar supaya menghala ke arah angin bertiup.
      style={{ transform: `rotate(${from + 180 + 45}deg)` }}
    />
  );
}

function IpuChip({ ipu }: { ipu: number | null }) {
  if (ipu === null)
    return <span className="text-muted text-sm font-bold">–</span>;
  return (
    <span
      className={`min-w-10 rounded-lg px-1.5 py-0.5 text-center text-sm font-extrabold tabular-nums ${CATEGORY_STYLE[ipuCategory(ipu).key].tint}`}
    >
      {ipu}
    </span>
  );
}

/** Blok kelabu berdenyut untuk rangka semasa data dimuatkan. */
const Bone = ({ className }: { className: string }) => (
  <span
    aria-hidden="true"
    className={`bg-line block animate-pulse rounded-md motion-reduce:animate-none ${className}`}
  />
);

/**
 * Ramalan per jam (v0.7.4–0.7.5): jalur boleh dileret untuk 24 jam akan datang — IPU (warna
 * tahap), ikon cuaca, suhu dan angin permukaan. `hours` tiada (bacaan lama dalam cache) →
 * rangka setinggi jalur sebenar, supaya bahagian lain tidak ditolak bila data tiba.
 */
export function HourlyStrip({ hours }: { hours: HourForecast[] | undefined }) {
  const { t, lang } = useI18n();
  return (
    <section
      aria-labelledby="ramalan-per-jam"
      className="flex flex-col gap-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <h2 id="ramalan-per-jam" className="font-display text-xl font-bold">
            {t("Ramalan per jam")}
          </h2>
          <InfoSheetButton
            title={t("Ramalan per jam")}
            label={t("Tentang ramalan per jam")}
            testId="info-hourly"
            rows={[
              {
                icon: ChartBar,
                text: "Pil berwarna ialah ramalan IPU bagi jam itu",
              },
              {
                icon: CloudSun,
                text: "Ikon cuaca dan suhu daripada Open-Meteo",
              },
              { icon: Wind, text: "Angin permukaan dalam km/j" },
              {
                icon: NavigationArrow,
                text: "Anak panah menunjukkan arah angin bertiup",
              },
            ]}
          />
        </div>
        <span className="text-muted text-xs font-semibold">
          {t("24 jam · leret →")}
        </span>
      </div>
      {hours && hours.length === 0 ? (
        <p className="bg-surface text-muted flex h-[164px] items-center justify-center rounded-2xl text-sm">
          {t("Ramalan per jam tidak tersedia buat masa ini.")}
        </p>
      ) : (
        <ul
          data-testid="hourly-strip"
          data-state={hours ? "ready" : "loading"}
          data-no-pull
          aria-busy={!hours}
          // Boleh difokus supaya jalur boleh ditatal dengan papan kekunci (WCAG).
          tabIndex={0}
          aria-label={t("Ramalan per jam, 24 jam akan datang")}
          className="-mx-5 flex snap-x scroll-px-5 [scrollbar-width:none] gap-1.5 overflow-x-auto px-5 pb-1 md:mx-0 md:scroll-px-0 md:px-0"
        >
          {hours
            ? hours.map((h, i) => {
                const look =
                  h.code != null ? weatherLook(h.code, h.isDay ?? true) : null;
                const Icon = look?.icon;
                return (
                  <li
                    key={h.time}
                    className={`flex h-[164px] w-16 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl py-2.5 ${i === 0 ? "bg-surface" : ""}`}
                  >
                    <span className="text-muted text-xs font-bold">
                      {i === 0 ? t("Kini") : formatHour(h.time, lang)}
                    </span>
                    <IpuChip ipu={h.ipu} />
                    <span className="flex h-6 items-center">
                      {Icon && look && (
                        <Icon
                          role="img"
                          aria-label={t(look.label)}
                          size={22}
                          weight="duotone"
                          color={look.color}
                        />
                      )}
                    </span>
                    <span className="text-sm font-bold tabular-nums">
                      {h.temperature != null ? `${h.temperature}°` : "–"}
                    </span>
                    <span className="text-muted flex items-center gap-0.5 text-xs tabular-nums">
                      {h.windDir != null && <WindArrow from={h.windDir} />}
                      {h.windSpeed ?? "–"}
                    </span>
                  </li>
                );
              })
            : Array.from({ length: 6 }, (_, i) => (
                <li
                  key={i}
                  aria-hidden="true"
                  className="flex h-[164px] w-16 shrink-0 flex-col items-center gap-2.5 py-2.5"
                >
                  <Bone className="h-3 w-9" />
                  <Bone className="h-6 w-10" />
                  <Bone className="size-6 rounded-full" />
                  <Bone className="h-4 w-7" />
                  <Bone className="h-3 w-6" />
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}

type DayRow = {
  date: string;
  label: string;
  average: number;
  peak: number;
  weather?: DayWeather;
};

/** Lajur baris harian: hari | IPU | hujan | suhu | kelembapan | angin. */
const DAY_COLS =
  "grid grid-cols-[minmax(0,1fr)_42px_38px_62px_34px_42px] items-center gap-1.5";

/**
 * Ramalan harian (v0.7.4–0.7.5): setiap hari dalam baris lutsinarnya sendiri, dengan kepala
 * lajur berikon (unit di kepala supaya kelembapan muat) dan togol 3 / 5 hari. Ketik baris
 * untuk puncak IPU. `weatherDays` tiada → sel cuaca dipaparkan sebagai rangka.
 */
export function DailyForecast({
  todayDate,
  today,
  days,
  weatherDays,
}: {
  todayDate: string;
  /** Purata dan puncak IPU hari ini (rasmi untuk jam lepas, ramalan untuk jam akan datang). */
  today: { average: number; peak: number } | null;
  days: DayForecast[];
  weatherDays: DayWeather[] | undefined;
}) {
  const { t, lang } = useI18n();
  const [count, setCount] = useState<3 | 5>(3);
  const [open, setOpen] = useState<string | null>(null);
  const weatherFor = (date: string) =>
    weatherDays?.find((w) => w.date === date);
  const rows: DayRow[] = [
    ...(today
      ? [
          {
            date: todayDate,
            label: t("Hari ini"),
            average: today.average,
            peak: today.peak,
            weather: weatherFor(todayDate),
          },
        ]
      : []),
    ...days.map((d) => ({
      date: d.date,
      // "Sab 17/10" → "Sab 17" supaya muat dalam baris.
      label: formatDay(d.date, todayDate, lang).replace(/\/\d+$/, ""),
      average: d.averageIpu,
      peak: d.maxIpu,
      weather: weatherFor(d.date),
    })),
  ];
  if (rows.length === 0) return null;
  const shown = rows.slice(0, count);
  const canFive = rows.length > 3;
  const loadingWeather = weatherDays === undefined;

  return (
    <section aria-labelledby="ramalan-harian" className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <h2 id="ramalan-harian" className="font-display text-xl font-bold">
            {t("Ramalan harian")}
          </h2>
          <InfoSheetButton
            title={t("Ramalan harian")}
            label={t("Tentang ramalan harian")}
            testId="info-daily"
            rows={[
              {
                icon: ChartBar,
                text: "Nombor ialah purata IPU hari itu, dikira seperti JAS (purata 24 jam) dan bermula daripada bacaan rasmi terkini; ketik baris untuk lihat puncak",
              },
              {
                icon: CalendarDots,
                text: "Ramalan model CAMS (Open-Meteo), hingga 5 hari",
              },
              { icon: CloudRain, text: "Peluang hujan tertinggi hari itu" },
              { icon: Thermometer, text: "Suhu maksimum / minimum" },
              { icon: Drop, text: "Purata kelembapan udara" },
              {
                icon: Wind,
                text: "Angin permukaan tertinggi (km/j) dan arahnya",
              },
            ]}
          />
        </div>
        {canFive && (
          <div
            role="group"
            aria-label={t("Tempoh ramalan")}
            className="bg-surface grid grid-cols-2 gap-0.5 rounded-xl p-0.5"
          >
            {([3, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={count === n}
                onClick={() => setCount(n)}
                className={`min-h-9 rounded-[10px] px-3 text-[13px] font-bold ${count === n ? "bg-page shadow-sm" : "text-muted"}`}
              >
                {t("{n} hari", { n: Math.min(n, rows.length) })}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        aria-hidden="true"
        className={`${DAY_COLS} text-muted px-3 text-[11px] font-bold`}
      >
        <span />
        <span className="text-center">IPU</span>
        <span className="flex justify-center">
          <CloudRain size={15} weight="bold" />
        </span>
        <span className="flex justify-center">
          <Thermometer size={15} weight="bold" />
        </span>
        <span className="flex justify-center">
          <Drop size={15} weight="bold" />
        </span>
        <span className="flex items-center justify-end">
          <Wind size={15} weight="bold" />
        </span>
      </div>

      <ul data-testid="daily-forecast" className="flex flex-col gap-1.5">
        {shown.map((r) => {
          const w = r.weather;
          const expanded = open === r.date;
          const look = w ? weatherLook(w.code, true) : null;
          return (
            <li key={r.date} className="bg-surface/70 rounded-2xl">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : r.date)}
                aria-label={[
                  r.label,
                  t("purata IPU {ipu}", { ipu: r.average }),
                  look ? t(look.label) : null,
                  w?.rainChance != null
                    ? t("hujan {n}%", { n: w.rainChance })
                    : null,
                  w ? `${w.max}° / ${w.min}°` : null,
                  w?.humidity != null
                    ? t("kelembapan {n}%", { n: w.humidity })
                    : null,
                  w?.windMax != null
                    ? t("angin {n} km/j", { n: w.windMax })
                    : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
                className={`${DAY_COLS} min-h-13 w-full px-3 text-left text-[13px]`}
              >
                <span className="truncate text-sm font-bold">{r.label}</span>
                <IpuChip ipu={r.average} />
                <span className="text-center tabular-nums">
                  {loadingWeather ? (
                    <Bone className="mx-auto h-3.5 w-7" />
                  ) : w?.rainChance != null ? (
                    `${w.rainChance}%`
                  ) : (
                    "–"
                  )}
                </span>
                <span className="text-center whitespace-nowrap tabular-nums">
                  {loadingWeather ? (
                    <Bone className="mx-auto h-3.5 w-12" />
                  ) : w ? (
                    <>
                      <b>{w.max}°</b>
                      <span className="text-muted">/{w.min}°</span>
                    </>
                  ) : (
                    "–"
                  )}
                </span>
                <span className="text-center tabular-nums">
                  {loadingWeather ? (
                    <Bone className="mx-auto h-3.5 w-6" />
                  ) : w?.humidity != null ? (
                    `${w.humidity}%`
                  ) : (
                    "–"
                  )}
                </span>
                <span className="text-muted flex items-center justify-end gap-0.5 text-xs whitespace-nowrap tabular-nums">
                  {loadingWeather ? (
                    <Bone className="h-3.5 w-8" />
                  ) : (
                    <>
                      {w?.windDir != null && <WindArrow from={w.windDir} />}
                      {w?.windMax ?? "–"}
                    </>
                  )}
                </span>
              </button>
              {expanded && (
                <p className="text-muted px-3 pb-3 text-xs font-semibold">
                  {t("Puncak ~{peak} · {label}", {
                    peak: r.peak,
                    label: t(ipuCategory(r.peak).label),
                  })}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
