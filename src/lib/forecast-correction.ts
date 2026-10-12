/**
 * Pembetulan ramalan model (CAMS melalui Open-Meteo) dengan bacaan rasmi APIMS.
 *
 * Model global kerap kurang menganggar jerebu (cth. Putrajaya 12 Okt 2026, 12 tgh:
 * APIMS 153, model 70). Pembetulan dibuat dalam unit PM2.5:
 * 1. Offset = median (PM2.5 setara rasmi − PM2.5 model) bagi 6 jam terakhir yang ada kedua-duanya.
 *    Offset tambah dipilih berbanding nisbah darab kerana nisbah membesarkan lonjakan model
 *    (cth. puncak malam) secara melampau.
 * 2. Offset berkurang secara linear ke 0 dalam 48 jam selepas bacaan rasmi terakhir.
 * 3. 6 jam pertama dicampur dengan bacaan rasmi terakhir (persistence) supaya graf berterusan.
 */

import type { HourlyOfficial } from "./apims";
import { ipuToPm25 } from "./ipu";

export const CORRECTION_WINDOW_HOURS = 6;
export const MIN_MATCHED_HOURS = 2;
export const DECAY_HOURS = 48;
export const PERSISTENCE_HOURS = 6;
/** Had magnitud offset (µg/m³) supaya data pelik tidak menghasilkan ramalan melampau. */
export const MAX_OFFSET = 200;

export type Correction = {
  /** Offset PM2.5 (µg/m³) pada jam bacaan rasmi terakhir. */
  offsetPm25: number;
  /** Bilangan jam yang dipadankan untuk mengira offset. */
  matchedHours: number;
  /** Jam bacaan rasmi terakhir (`YYYY-MM-DDTHH:00`). */
  anchorTime: string;
  anchorIpu: number;
};

const hoursBetween = (a: string, b: string) =>
  (Date.parse(`${b}:00Z`) - Date.parse(`${a}:00Z`)) / 3_600_000;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  return sorted.length % 2
    ? sorted[Math.floor(mid)]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Kira offset daripada jam lepas yang mempunyai bacaan rasmi dan model. */
export function computeCorrection(
  times: readonly string[],
  pm25: readonly (number | null)[],
  history: readonly HourlyOfficial[],
  nowKey: string,
): Correction | null {
  const model = new Map(times.map((t, i) => [t, pm25[i]]));
  const matched = history
    .filter(
      (h): h is { time: string; ipu: number } =>
        h.ipu !== null && h.time <= nowKey && model.get(h.time) != null,
    )
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(-CORRECTION_WINDOW_HOURS);
  if (matched.length < MIN_MATCHED_HOURS) return null;
  const anchor = matched[matched.length - 1];
  // Bacaan rasmi terakhir mesti baru (≤ 3 jam) untuk dijadikan asas.
  if (hoursBetween(anchor.time, nowKey) > 3) return null;
  const offset = median(
    matched.map((h) => ipuToPm25(h.ipu) - (model.get(h.time) as number)),
  );
  return {
    offsetPm25:
      Math.round(Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, offset)) * 10) / 10,
    matchedHours: matched.length,
    anchorTime: anchor.time,
    anchorIpu: anchor.ipu,
  };
}

/** PM2.5 ramalan yang dibetulkan bagi jam selepas `anchorTime`; jam lain tidak berubah. */
export function applyCorrection(
  times: readonly string[],
  pm25: readonly (number | null)[],
  correction: Correction,
): (number | null)[] {
  const anchorPm = ipuToPm25(correction.anchorIpu);
  return pm25.map((value, i) => {
    const lead = hoursBetween(correction.anchorTime, times[i]);
    if (value === null || lead <= 0) return value;
    const decay = Math.max(0, 1 - lead / DECAY_HOURS);
    // Jangan jatuh di bawah separuh nilai model bila offset negatif.
    const corrected = Math.max(
      value * 0.5,
      value + correction.offsetPm25 * decay,
    );
    const weight = Math.max(0, 1 - lead / PERSISTENCE_HOURS);
    return weight * anchorPm + (1 - weight) * corrected;
  });
}
