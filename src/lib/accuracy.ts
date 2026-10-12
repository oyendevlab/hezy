/**
 * Ketepatan anggaran dan ramalan Hezy berbanding bacaan rasmi APIMS (item 4).
 * - Anggaran: IPU model (purata PM2.5 24 jam) berbanding IPU rasmi pada jam yang sama.
 * - Ramalan: ramalan esok yang disimpan setiap malam (model asal dan yang dibetulkan)
 *   berbanding IPU rasmi keesokan harinya.
 * Ralat ialah ralat mutlak purata (MAE) dalam unit IPU.
 */

import { applyCorrection, computeCorrection } from "./forecast-correction";
import type { DayHours, HourlyDay } from "./history";
import { addDays } from "./history";
import type { HourlyOfficial } from "./apims";
import { pm25ToIpu, rolling24hAverage } from "./ipu";
import type { AirQualitySeries } from "./openmeteo";

/** Tempoh purata yang dipaparkan kepada pengguna. */
export const ACCURACY_WINDOW_DAYS = 14;
/** Hari minimum dengan data sebelum nilai stesen digunakan (jika tidak, nilai kebangsaan). */
export const MIN_STATION_DAYS = 3;
export const KEEP_ACCURACY_DAYS = 120;
/** Hari minimum sebelum "±N" dipaparkan kepada pengguna. */
export const MIN_DISPLAY_DAYS = 3;

/** Ralat untuk dipaparkan, atau null jika data belum cukup. */
export function shownError(
  summary: AccuracySummary | null | undefined,
  key: "estimate" | "forecast",
): number | null {
  if (!summary) return null;
  if (key === "forecast" && summary.days < MIN_DISPLAY_DAYS) return null;
  return summary[key];
}

/** Ralat terkumpul: [jumlah ralat mutlak, bilangan jam]. */
export type ErrorSum = [sum: number, n: number];

/** Ramalan 24 jam bagi satu tarikh sasaran, disimpan malam sebelumnya. */
export type ForecastSnapshot = {
  date: string;
  madeAt: string;
  stations: Record<string, { raw: DayHours; corrected: DayHours }>;
};

export type StationAccuracy = {
  /** Anggaran model berbanding rasmi. */
  e?: ErrorSum;
  /** Ramalan model asal. */
  fr?: ErrorSum;
  /** Ramalan dibetulkan. */
  fc?: ErrorSum;
};

export type AccuracyIndex = {
  updatedAt: string;
  days: Record<string, Record<string, StationAccuracy>>;
};

export type AccuracySummary = {
  /** MAE anggaran (IPU), atau null jika tiada data. */
  estimate: number | null;
  /** MAE ramalan dibetulkan. */
  forecast: number | null;
  /** MAE ramalan model asal (untuk perbandingan). */
  forecastRaw: number | null;
  /** Bilangan hari dengan data ramalan. */
  days: number;
  scope: "station" | "national";
};

function errorSum(
  predicted: readonly (number | null)[],
  actual: readonly (number | null)[],
): ErrorSum | undefined {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < Math.min(predicted.length, actual.length); i++) {
    const p = predicted[i];
    const a = actual[i];
    if (p === null || a === null) continue;
    sum += Math.abs(p - a);
    n++;
  }
  return n > 0 ? [sum, n] : undefined;
}

/** IPU anggaran model (purata 24 jam) bagi setiap jam `date`. */
export function estimateHours(
  series: AirQualitySeries,
  date: string,
): DayHours {
  const averages = rolling24hAverage(series.pm25);
  const hours: DayHours = Array.from({ length: 24 }, () => null);
  series.times.forEach((t, i) => {
    if (t.slice(0, 10) !== date || averages[i] === null) return;
    hours[Number(t.slice(11, 13))] = pm25ToIpu(averages[i] as number);
  });
  return hours;
}

/** Ramalan IPU sejam bagi `date` (model asal dan dibetulkan dengan sejarah rasmi). */
export function forecastHours(
  series: AirQualitySeries,
  history: readonly HourlyOfficial[],
  nowKey: string,
  date: string,
): { raw: DayHours; corrected: DayHours } {
  const correction = computeCorrection(
    series.times,
    series.pm25,
    history,
    nowKey,
  );
  const fixed = correction
    ? applyCorrection(series.times, series.pm25, correction)
    : series.pm25;
  const raw: DayHours = Array.from({ length: 24 }, () => null);
  const corrected: DayHours = Array.from({ length: 24 }, () => null);
  series.times.forEach((t, i) => {
    if (t.slice(0, 10) !== date) return;
    const h = Number(t.slice(11, 13));
    const r = series.pm25[i];
    const c = fixed[i];
    raw[h] = r === null ? null : pm25ToIpu(r);
    corrected[h] = c === null ? null : pm25ToIpu(c);
  });
  return { raw, corrected };
}

/** Ralat anggaran bagi satu hari, ikut stesen. */
export function estimateErrors(
  estimates: Record<string, DayHours>,
  actual: HourlyDay,
): Record<string, ErrorSum> {
  const out: Record<string, ErrorSum> = {};
  for (const [id, hours] of Object.entries(estimates)) {
    const e = errorSum(hours, actual.stations[id] ?? []);
    if (e) out[id] = e;
  }
  return out;
}

/** Ralat ramalan bagi satu hari, ikut stesen. */
export function forecastErrors(
  snapshot: ForecastSnapshot,
  actual: HourlyDay,
): Record<string, { fr: ErrorSum; fc: ErrorSum }> {
  const out: Record<string, { fr: ErrorSum; fc: ErrorSum }> = {};
  for (const [id, f] of Object.entries(snapshot.stations)) {
    const real = actual.stations[id] ?? [];
    const fr = errorSum(f.raw, real);
    const fc = errorSum(f.corrected, real);
    if (fr && fc) out[id] = { fr, fc };
  }
  return out;
}

/** Gabung ralat baharu ke dalam indeks dan buang hari lama. */
export function mergeAccuracy(
  index: AccuracyIndex | null,
  date: string,
  patch: Record<string, StationAccuracy>,
  now: Date,
): AccuracyIndex {
  const days = { ...(index?.days ?? {}) };
  const day = { ...(days[date] ?? {}) };
  for (const [id, acc] of Object.entries(patch)) {
    day[id] = { ...day[id], ...acc };
  }
  days[date] = day;
  const cutoff = addDays(date, -KEEP_ACCURACY_DAYS);
  for (const d of Object.keys(days)) if (d <= cutoff) delete days[d];
  return { updatedAt: now.toISOString(), days };
}

const mae = (s: ErrorSum) => (s[1] > 0 ? s[0] / s[1] : null);

function pool(
  index: AccuracyIndex | null,
  today: string,
  stationIds: readonly string[] | null,
) {
  const total = { e: [0, 0], fr: [0, 0], fc: [0, 0] } as Record<
    "e" | "fr" | "fc",
    ErrorSum
  >;
  const forecastDays = new Set<string>();
  const from = addDays(today, -ACCURACY_WINDOW_DAYS);
  for (const [date, stations] of Object.entries(index?.days ?? {})) {
    if (date < from || date >= today) continue;
    for (const [id, acc] of Object.entries(stations)) {
      if (stationIds && !stationIds.includes(id)) continue;
      for (const key of ["e", "fr", "fc"] as const) {
        const s = acc[key];
        if (!s) continue;
        total[key][0] += s[0];
        total[key][1] += s[1];
        if (key === "fc") forecastDays.add(date);
      }
    }
  }
  return { total, days: forecastDays.size };
}

const round = (v: number | null) => (v === null ? null : Math.round(v));

/**
 * Ringkasan 14 hari: bagi stesen (jika cukup data) atau seluruh negara.
 * Hari ini tidak dikira kerana belum lengkap.
 */
export function summarizeAccuracy(
  index: AccuracyIndex | null,
  today: string,
  stationId: string | null = null,
): AccuracySummary {
  const all = pool(index, today, null);
  const national = {
    estimate: round(mae(all.total.e)),
    forecast: round(mae(all.total.fc)),
    forecastRaw: round(mae(all.total.fr)),
  };
  if (stationId) {
    const local = pool(index, today, [stationId]);
    const estimateDays = Object.entries(index?.days ?? {}).filter(
      ([d, s]) =>
        d < today &&
        d >= addDays(today, -ACCURACY_WINDOW_DAYS) &&
        s[stationId]?.e,
    ).length;
    if (estimateDays >= MIN_STATION_DAYS) {
      // Ramalan stesen hanya digunakan bila cukup hari; jika tidak, nilai kebangsaan.
      const enough = local.days >= MIN_STATION_DAYS;
      return {
        estimate: round(mae(local.total.e)),
        forecast: enough ? round(mae(local.total.fc)) : national.forecast,
        forecastRaw: enough ? round(mae(local.total.fr)) : national.forecastRaw,
        days: enough ? local.days : all.days,
        scope: "station",
      };
    }
  }
  return { ...national, days: all.days, scope: "national" };
}
