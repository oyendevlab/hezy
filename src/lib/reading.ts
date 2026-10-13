import type { AccuracySummary } from "./accuracy";
import type { CurrentWeather, DayWeather } from "./weather";
import type { Wind } from "./wind";
import type { HourlyOfficial } from "./apims";
import { findBestWindow, type BestWindow } from "./best-time";
import {
  applyCorrection,
  computeCorrection,
  type Correction,
} from "./forecast-correction";
import {
  ipuCategory,
  isEmergency,
  pm25ToIpu,
  rolling24hAverage,
  type IpuCategoryKey,
} from "./ipu";
import type { OfficialReading } from "./official";
import type { AirQualitySeries } from "./openmeteo";

export const TIME_ZONE = "Asia/Kuala_Lumpur";

/** Bacaan dianggap lapuk jika jam terkini yang ada lebih 3 jam lebih awal daripada sekarang. */
export const STALE_AFTER_HOURS = 3;

/** Ramalan satu hari: purata dan maksimum IPU sejam. */
export type DayForecast = { date: string; averageIpu: number; maxIpu: number };

/** Jam minimum dengan data untuk mengira ramalan sehari. */
const MIN_HOURS_PER_DAY = 12;

export type HourPoint = {
  time: string;
  /** IPU kaedah JAS (purata PM2.5 24 jam). */
  ipu: number | null;
  /**
   * IPU sejam: formula yang sama digunakan pada PM2.5 jam itu sahaja.
   * Lebih responsif untuk graf dan masa terbaik keluar, tetapi bukan IPU rasmi.
   */
  hourlyIpu: number | null;
  /** IPU rasmi APIMS bagi jam ini (stesen terdekat); hanya untuk jam yang sudah lepas. */
  officialIpu?: number | null;
  forecast: boolean;
  /** Nilai model jam ini dibetulkan dengan bacaan rasmi APIMS (jam selepas bacaan rasmi terakhir). */
  corrected?: boolean;
};

export type Reading = {
  source: "open-meteo";
  /** IPU dikira daripada PM2.5 sahaja, bukan bacaan rasmi APIMS. */
  estimate: true;
  generatedAt: string;
  current: {
    time: string;
    ipu: number;
    category: IpuCategoryKey;
    label: string;
    emergency: boolean;
    pm25Average: number;
  } | null;
  /** Perubahan IPU berbanding 3 jam lalu. */
  change3h: number | null;
  /** 24 jam hari ini (waktu tempatan); jam selepas sekarang ialah ramalan. */
  today: HourPoint[];
  /** Tetingkap 3 jam terbaik untuk keluar dalam 24 jam akan datang, berdasarkan IPU sejam (ramalan). */
  bestWindow: BestWindow | null;
  /** Ramalan harian bagi 3 hari selepas hari ini, daripada IPU sejam model. */
  days: DayForecast[];
  stale: boolean;
  /** Bacaan rasmi APIMS stesen terdekat (≤ 30 km, ≤ 3 jam); diisi oleh route API. */
  official: OfficialReading | null;
  /** Negeri lokasi untuk bendera kad kongsi (stesen terdekat; `null` di sempadan); diisi oleh route API. */
  state?: string | null;
  /** Cuaca semasa (langit hidup, ikon dan suhu); diisi oleh route API. */
  weather?: CurrentWeather | null;
  /** Cuaca harian hari-hari akan datang (ikon ramalan 3 hari). */
  weatherDays?: DayWeather[];
  /** Angin 850 hPa semasa dan anggaran asal jerebu (item 1); diisi oleh route API. */
  wind?: Wind | null;
  /** Ralat purata 14 hari berbanding bacaan rasmi (item 4); diisi oleh route API. */
  accuracy?: AccuracySummary | null;
  /** Pembetulan ramalan dengan bacaan APIMS; tiada dalam bacaan lama tersimpan. */
  correction?: Correction | null;
};

/** Jam semasa dalam waktu Malaysia, format `YYYY-MM-DDTHH:00` (sama seperti Open-Meteo). */
export function localHourKey(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:00`;
}

const hoursBetween = (a: string, b: string) =>
  (Date.parse(`${b}:00Z`) - Date.parse(`${a}:00Z`)) / 3_600_000;

/**
 * Bina bacaan daripada siri model. `history` (IPU rasmi sejam stesen terdekat) digunakan
 * untuk membetulkan ramalan; tanpanya ramalan ialah model mentah.
 */
export function buildReading(
  series: AirQualitySeries,
  now: Date,
  history: readonly HourlyOfficial[] = [],
): Reading {
  const nowKey = localHourKey(now);
  const correction = computeCorrection(
    series.times,
    series.pm25,
    history,
    nowKey,
  );
  const forecastPm25 = correction
    ? applyCorrection(series.times, series.pm25, correction)
    : series.pm25;
  const averages = rolling24hAverage(series.pm25);
  const ipus = averages.map((avg) => (avg === null ? null : pm25ToIpu(avg)));

  // Jam terkini yang mempunyai bacaan PM2.5 sebenar dan IPU, tidak melebihi jam sekarang.
  // Purata 24 jam masih boleh dikira selepas data terhenti, jadi semak bacaan mentah juga.
  let currentIndex = -1;
  for (let i = 0; i < series.times.length && series.times[i] <= nowKey; i++) {
    if (series.pm25[i] !== null && ipus[i] !== null) currentIndex = i;
  }

  let current: Reading["current"] = null;
  let change3h: number | null = null;
  if (currentIndex >= 0) {
    const ipu = ipus[currentIndex] as number;
    const category = ipuCategory(ipu);
    current = {
      time: series.times[currentIndex],
      ipu,
      category: category.key,
      label: category.label,
      emergency: isEmergency(ipu),
      pm25Average: Math.round((averages[currentIndex] as number) * 10) / 10,
    };
    const before = ipus[currentIndex - 3];
    change3h = before === null || before === undefined ? null : ipu - before;
  }

  const hours: HourPoint[] = series.times.map((time, i) => {
    const forecast = time > nowKey;
    // Jam selepas bacaan rasmi terakhir (termasuk jam semasa yang belum diterbitkan APIMS).
    const corrected = correction !== null && time > correction.anchorTime;
    const pm25 = corrected ? forecastPm25[i] : series.pm25[i];
    return {
      time,
      ipu: ipus[i],
      hourlyIpu: pm25 === null ? null : pm25ToIpu(pm25),
      forecast,
      ...(corrected ? { corrected: true } : {}),
    };
  });

  const todayDate = nowKey.slice(0, 10);
  const today = hours.filter((h) => h.time.startsWith(todayDate));

  const upcoming = hours
    .filter((h) => h.forecast)
    .slice(0, 24)
    .map((h) => ({ time: h.time, ipu: h.hourlyIpu }));
  const bestWindow = findBestWindow(upcoming, 0);

  const byDate = new Map<string, number[]>();
  for (const h of hours) {
    const date = h.time.slice(0, 10);
    if (date <= todayDate || h.hourlyIpu === null) continue;
    byDate.set(date, [...(byDate.get(date) ?? []), h.hourlyIpu]);
  }
  const days: DayForecast[] = [...byDate]
    .filter(([, values]) => values.length >= MIN_HOURS_PER_DAY)
    .slice(0, 3)
    .map(([date, values]) => ({
      date,
      averageIpu: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      maxIpu: Math.max(...values),
    }));

  return {
    source: "open-meteo",
    estimate: true,
    generatedAt: now.toISOString(),
    current,
    change3h,
    today,
    bestWindow,
    days,
    official: null,
    correction,
    stale:
      current === null ||
      hoursBetween(current.time, nowKey) > STALE_AFTER_HOURS,
  };
}
