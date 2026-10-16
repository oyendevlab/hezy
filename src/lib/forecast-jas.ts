/**
 * Model ramalan E (v0.8.3, docs/AUDIT-0.8.md §2): ramalan IPU dalam unit JAS.
 *
 * IPU rasmi APIMS ialah purata bergerak PM2.5 24 jam, jadi ramalan dibuat dalam unit yang sama
 * (kaedah v0.8.0 meramal IPU sejam yang turun naik mengikut kitaran harian):
 * 1. Offset PM2.5 supaya purata 24 jam model pada jam rasmi terakhir sama dengan IPU rasmi.
 *    Offset dikenakan pada semua jam sehingga jam itu, jadi tetingkap 24 jam tidak bias.
 * 2. Selepas jam itu offset berkurang secara linear ke 0 dalam 168 jam (7 hari, v0.8.8; dahulu
 *    72 jam sehingga ramalan hari ke-3–5 jatuh kepada model mentah yang bias); model tidak dibiar
 *    jatuh di bawah 30% nilai asalnya bila offset negatif.
 * 3. IPU = purata bergerak 24 jam PM2.5 yang dibetulkan (bermula tepat pada nombor rasmi).
 * 4. Dicampur dengan bacaan rasmi terakhir, berat e^(−jam/12): IPU rasmi berubah perlahan.
 * Tanpa bacaan rasmi yang baru: purata 24 jam model mentah.
 *
 * Backtest 7 hari, 68 stesen (MAE IPU): 4.1 / 15.4 / 24.2 / 29.8 bagi 1–6 / 7–24 / 25–48 /
 * 49–72 jam, berbanding 10.6 / 24.3 / 32.7 / 39.3 untuk kaedah v0.8.0. Reput 168 jam (v0.8.8):
 * 23.4 / 25.3 / 26.7 / 30.2 bagi 25–48 / 49–72 / 73–96 / 97–120 jam, berbanding 24.2 / 29.8 /
 * 36.8 / 42.8 dengan reput 72 jam; jam awal tidak berubah.
 */

import type { HourlyOfficial } from "./apims";
import { MAX_OFFSET } from "./forecast-correction";
import { ipuToPm25, pm25ToIpu, rolling24hAverage } from "./ipu";

export const JAS_DECAY_HOURS = 168;
export const JAS_PERSISTENCE_TAU_HOURS = 12;
export const JAS_MODEL_FLOOR = 0.3;
/** Bacaan rasmi lebih lama daripada ini (jam) tidak dijadikan asas. */
export const JAS_ANCHOR_MAX_AGE_HOURS = 3;

export type JasAnchor = {
  /** Jam bacaan rasmi terakhir (`YYYY-MM-DDTHH:00`). */
  time: string;
  ipu: number;
  /** Offset PM2.5 (µg/m³) supaya purata 24 jam model = IPU rasmi. */
  offsetPm25: number;
};

const hoursBetween = (a: string, b: string) =>
  (Date.parse(`${b}:00Z`) - Date.parse(`${a}:00Z`)) / 3_600_000;

/** Asas ramalan: bacaan rasmi terakhir (≤ 3 jam) yang mempunyai purata 24 jam model. */
export function jasAnchor(
  times: readonly string[],
  pm25: readonly (number | null)[],
  history: readonly HourlyOfficial[],
  nowKey: string,
): JasAnchor | null {
  let latest: { time: string; ipu: number } | null = null;
  for (const h of history) {
    if (h.ipu === null || h.time > nowKey) continue;
    if (latest === null || h.time > latest.time)
      latest = { time: h.time, ipu: h.ipu };
  }
  if (!latest || hoursBetween(latest.time, nowKey) > JAS_ANCHOR_MAX_AGE_HOURS)
    return null;
  const index = times.indexOf(latest.time);
  const average = index < 0 ? null : rolling24hAverage(pm25)[index];
  if (average === null || average === undefined) return null;
  const offset = ipuToPm25(latest.ipu) - average;
  return {
    time: latest.time,
    ipu: latest.ipu,
    offsetPm25:
      Math.round(Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, offset)) * 10) / 10,
  };
}

/** IPU unit JAS bagi setiap jam dalam siri (ramalan bagi jam selepas asas). */
export function jasForecast(
  times: readonly string[],
  pm25: readonly (number | null)[],
  history: readonly HourlyOfficial[],
  nowKey: string,
): { anchor: JasAnchor | null; ipu: (number | null)[] } {
  const anchor = jasAnchor(times, pm25, history, nowKey);
  if (!anchor) {
    return {
      anchor: null,
      ipu: rolling24hAverage(pm25).map((avg) =>
        avg === null ? null : pm25ToIpu(avg),
      ),
    };
  }
  const corrected = pm25.map((value, i) => {
    if (value === null) return null;
    const lead = hoursBetween(anchor.time, times[i]);
    const decay = lead <= 0 ? 1 : Math.max(0, 1 - lead / JAS_DECAY_HOURS);
    return Math.max(value * JAS_MODEL_FLOOR, value + anchor.offsetPm25 * decay);
  });
  const ipu = rolling24hAverage(corrected).map((avg, i) => {
    if (avg === null) return null;
    const model = pm25ToIpu(avg);
    const lead = hoursBetween(anchor.time, times[i]);
    if (lead <= 0) return model;
    const weight = Math.exp(-lead / JAS_PERSISTENCE_TAU_HOURS);
    return Math.round(weight * anchor.ipu + (1 - weight) * model);
  });
  return { anchor, ipu };
}
