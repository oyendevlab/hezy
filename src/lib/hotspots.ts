/**
 * Titik panas kebakaran daripada NASA FIRMS (VIIRS, 375 m) untuk rantau Malaysia,
 * Sumatera dan Kalimantan (item 2). Kunci `FIRMS_MAP_KEY` hanya di pelayan.
 */

import { distanceKm } from "./apims";
import type { Coords } from "./coords";

/** Kotak rantau: barat, selatan, timur, utara. */
export const FIRMS_AREA = "95,-6,120,8";
export const FIRMS_DAYS = 2;
export const FIRMS_SOURCES = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"] as const;
/** Saiz sel grid untuk menggabungkan titik berdekatan (darjah, ~5 km). */
export const CELL_DEG = 0.05;

export function firmsUrl(key: string, source: string): string {
  return `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/${source}/${FIRMS_AREA}/${FIRMS_DAYS}`;
}

export type FirePoint = { lat: number; lon: number; frp: number };

/** Sel titik panas: [lat, lon, bilangan, FRP maksimum (MW)]. */
export type HotspotCell = [
  lat: number,
  lon: number,
  count: number,
  frp: number,
];

/** Baca CSV FIRMS; buang keyakinan rendah ("l") dan baris rosak. */
export function parseFirmsCsv(csv: string): FirePoint[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",");
  const col = (name: string) => header.indexOf(name);
  const iLat = col("latitude");
  const iLon = col("longitude");
  const iConf = col("confidence");
  const iFrp = col("frp");
  if (iLat < 0 || iLon < 0) {
    throw new Error("CSV FIRMS tidak dijangka: tiada latitude/longitude.");
  }
  const points: FirePoint[] = [];
  for (const line of lines.slice(1)) {
    const f = line.split(",");
    const lat = Number(f[iLat]);
    const lon = Number(f[iLon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (iConf >= 0 && f[iConf]?.trim().toLowerCase() === "l") continue;
    const frp = Number(f[iFrp]);
    points.push({ lat, lon, frp: Number.isFinite(frp) ? frp : 0 });
  }
  return points;
}

/** Gabung titik ke dalam sel grid (titik dua satelit yang sama bertindih). */
export function aggregate(points: readonly FirePoint[]): HotspotCell[] {
  const cells = new Map<string, HotspotCell>();
  for (const p of points) {
    const lat = Math.round(p.lat / CELL_DEG) * CELL_DEG;
    const lon = Math.round(p.lon / CELL_DEG) * CELL_DEG;
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cell = cells.get(key);
    if (cell) {
      cell[2]++;
      cell[3] = Math.max(cell[3], Math.round(p.frp));
    } else {
      cells.set(key, [
        Number(lat.toFixed(2)),
        Number(lon.toFixed(2)),
        1,
        Math.round(p.frp),
      ]);
    }
  }
  return [...cells.values()];
}

const rad = (d: number) => (d * Math.PI) / 180;

/** Bearing (darjah dari utara) dari `a` ke `b`. */
export function bearing(a: Coords, b: Coords): number {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Bilangan sel titik panas di hulu angin: dalam `maxKm` dan dalam ±`halfAngle`°
 * daripada arah angin datang.
 */
export function upwindHotspots(
  cells: readonly HotspotCell[],
  point: Coords,
  from: number,
  maxKm = 600,
  halfAngle = 30,
): number {
  let n = 0;
  for (const [lat, lon] of cells) {
    const c = { lat, lon };
    if (distanceKm(point, c) > maxKm) continue;
    const diff = Math.abs(((bearing(point, c) - from + 540) % 360) - 180);
    if (diff <= halfAngle) n++;
  }
  return n;
}
