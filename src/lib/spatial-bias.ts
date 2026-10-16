/**
 * Anggaran kawasan tanpa stesen (v0.8.5, docs/AUDIT-0.8.md D1).
 *
 * Model CAMS kurang menganggar jerebu secara sistematik (backtest: −35 IPU). Bagi lokasi tanpa
 * bacaan rasmi dalam 30 km, bias stesen APIMS berdekatan dipindahkan ke lokasi itu:
 * 1. Bias setiap stesen = PM2.5 setara IPU rasmi (≤ 3 jam) − purata 24 jam model di stesen.
 * 2. Purata berwajaran jarak (IDW, w = 1/d², d ≥ 5 km) bagi ≤ 5 stesen dalam 150 km.
 * 3. Dipudarkan secara linear ke 0 pada 200 km dari stesen terdekat.
 * 4. Siri model dibetulkan sebelum bacaan dibina; selepas jam bias, pembetulan reput ke 0
 *    dalam 72 jam (seperti model E); model tidak dibiar jatuh di bawah 30%.
 * Backtest tinggal-satu-keluar (7 hari, 68 stesen): ralat 26–42 → 10–18 IPU.
 */

import { distanceKm, type Station } from "./apims";
import { ipuToPm25, rolling24hAverage } from "./ipu";
import type { AirQualitySeries } from "./openmeteo";

export const SPATIAL_MAX_STATIONS = 5;
export const SPATIAL_MAX_KM = 150;
export const SPATIAL_FADE_KM = 200;
export const SPATIAL_MIN_KM = 5;
export const SPATIAL_DECAY_HOURS = 72;
export const SPATIAL_MODEL_FLOOR = 0.3;
/** Bacaan rasmi lebih lama daripada ini (jam) tidak digunakan. */
export const SPATIAL_MAX_AGE_HOURS = 3;

export type StationBias = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Jam bacaan rasmi (`YYYY-MM-DDTHH:00`). */
  time: string;
  /** PM2.5 setara rasmi − purata 24 jam model (µg/m³). */
  biasPm25: number;
};

export type SpatialBias = {
  biasPm25: number;
  /** Jam bias (bacaan rasmi terkini antara stesen yang digunakan). */
  time: string;
  stations: number;
  nearestName: string;
  nearestKm: number;
};

const hoursBetween = (a: string, b: string) =>
  (Date.parse(`${b}:00Z`) - Date.parse(`${a}:00Z`)) / 3_600_000;

/** Purata 24 jam model pada `time` (atau null jika tiada data cukup). */
function averageAt(series: AirQualitySeries, time: string): number | null {
  const index = series.times.indexOf(time);
  if (index < 0) return null;
  return rolling24hAverage(series.pm25.slice(0, index + 1))[index] ?? null;
}

/** Bias setiap stesen yang mempunyai bacaan rasmi baru dan siri model di lokasinya. */
export function stationBiases(
  stations: readonly Station[],
  models: Readonly<Record<string, AirQualitySeries>>,
  nowKey: string,
): StationBias[] {
  return stations.flatMap((s): StationBias[] => {
    if (s.ipu === null || s.time === null) return [];
    const time = `${s.time.slice(0, 13)}:00`;
    if (hoursBetween(time, nowKey) > SPATIAL_MAX_AGE_HOURS) return [];
    const model = models[s.id];
    const average = model ? averageAt(model, time) : null;
    if (average === null) return [];
    return [
      {
        id: s.id,
        name: s.name,
        lat: s.lat,
        lon: s.lon,
        time,
        biasPm25: ipuToPm25(s.ipu) - average,
      },
    ];
  });
}

/** Bias IDW di `point`, atau null jika tiada stesen dalam 150 km. */
export function idwBias(
  point: { lat: number; lon: number },
  biases: readonly StationBias[],
  exclude?: string,
): SpatialBias | null {
  const near = biases
    .filter((b) => b.id !== exclude)
    .map((b) => ({ b, d: distanceKm(point, b) }))
    .filter(({ d }) => d <= SPATIAL_MAX_KM)
    .sort((x, y) => x.d - y.d)
    .slice(0, SPATIAL_MAX_STATIONS);
  if (near.length === 0) return null;
  let weights = 0;
  let sum = 0;
  for (const { b, d } of near) {
    const w = 1 / Math.max(d, SPATIAL_MIN_KM) ** 2;
    weights += w;
    sum += w * b.biasPm25;
  }
  const nearest = near[0];
  const fade = Math.max(0, 1 - nearest.d / SPATIAL_FADE_KM);
  return {
    biasPm25: Math.round((sum / weights) * fade * 10) / 10,
    time: near
      .map(({ b }) => b.time)
      .sort()
      .at(-1) as string,
    stations: near.length,
    nearestName: nearest.b.name,
    nearestKm: Math.round(nearest.d),
  };
}

/** Siri model dibetulkan dengan bias ruang (penuh hingga jam bias, reput selepasnya). */
export function applySpatialBias(
  series: AirQualitySeries,
  bias: Pick<SpatialBias, "biasPm25" | "time">,
): AirQualitySeries {
  return {
    times: series.times,
    pm25: series.pm25.map((value, i) => {
      if (value === null) return null;
      const lead = hoursBetween(bias.time, series.times[i]);
      const decay = lead <= 0 ? 1 : Math.max(0, 1 - lead / SPATIAL_DECAY_HOURS);
      return Math.max(
        value * SPATIAL_MODEL_FLOOR,
        value + bias.biasPm25 * decay,
      );
    }),
  };
}
