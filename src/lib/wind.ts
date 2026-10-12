/**
 * Arah angin dan anggaran asal jerebu (item 1).
 * Angin paras 850 hPa (~1.5 km) daripada Open-Meteo digunakan kerana ia mewakili aliran yang
 * membawa asap merentas Selat Melaka/Laut China Selatan; angin permukaan terlalu berubah-ubah.
 */

import type { Coords } from "./coords";

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

export type WindSeries = {
  times: string[];
  speed: (number | null)[];
  direction: (number | null)[];
};

export type Compass =
  | "utara"
  | "timur-laut"
  | "timur"
  | "tenggara"
  | "selatan"
  | "barat-daya"
  | "barat"
  | "barat-laut";

export type SmokeSource = "sumatera" | "kalimantan";

export type Wind = {
  /** Arah angin DATANG (darjah dari utara, meteorologi). */
  direction: number;
  /** km/j */
  speed: number;
  compass: Compass;
  /** Kawasan kebakaran biasa di hulu angin, jika ada. */
  source: SmokeSource | null;
  /** Bilangan titik panas FIRMS (sel ~5 km, 2 hari) di hulu angin; diisi oleh route API. */
  hotspots?: number | null;
};

/** Angin bawah 3 km/j dianggap tenang: arah tidak bermakna. */
export const CALM_KMH = 3;

export function windUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "wind_speed_850hPa,wind_direction_850hPa",
    wind_speed_unit: "kmh",
    timezone: "Asia/Kuala_Lumpur",
    past_days: "1",
    forecast_days: "2",
  });
  return `${ENDPOINT}?${params}`;
}

export function parseWind(json: unknown): WindSeries {
  const h = (
    json as {
      hourly?: {
        time?: unknown;
        wind_speed_850hPa?: unknown;
        wind_direction_850hPa?: unknown;
      };
    } | null
  )?.hourly;
  const times = h?.time;
  const speed = h?.wind_speed_850hPa;
  const direction = h?.wind_direction_850hPa;
  if (
    !Array.isArray(times) ||
    !Array.isArray(speed) ||
    !Array.isArray(direction) ||
    speed.length !== times.length ||
    direction.length !== times.length
  ) {
    throw new Error("Respons angin Open-Meteo tidak dijangka.");
  }
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  return {
    times: times.map(String),
    speed: speed.map(num),
    direction: direction.map(num),
  };
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Purata vektor angin (arah datang) bagi jam `nowKey` ± `span` jam. */
export function meanWind(
  series: WindSeries,
  nowKey: string,
  span = 3,
): { direction: number; speed: number } | null {
  const i = series.times.indexOf(nowKey);
  if (i < 0) return null;
  let u = 0;
  let v = 0;
  let n = 0;
  for (
    let j = Math.max(0, i - span);
    j <= Math.min(series.times.length - 1, i + span);
    j++
  ) {
    const s = series.speed[j];
    const d = series.direction[j];
    if (s === null || d === null) continue;
    u += s * Math.sin(rad(d));
    v += s * Math.cos(rad(d));
    n++;
  }
  if (n === 0) return null;
  u /= n;
  v /= n;
  return {
    direction: Math.round((deg(Math.atan2(u, v)) + 360) % 360),
    speed: Math.round(Math.hypot(u, v)),
  };
}

const COMPASS: Compass[] = [
  "utara",
  "timur-laut",
  "timur",
  "tenggara",
  "selatan",
  "barat-daya",
  "barat",
  "barat-laut",
];

export function compassOf(direction: number): Compass {
  return COMPASS[Math.round((((direction % 360) + 360) % 360) / 45) % 8];
}

/** Titik pada jarak `km` dari `p` mengikut bearing (darjah). */
export function destination(p: Coords, bearing: number, km: number): Coords {
  const R = 6371;
  const d = km / R;
  const lat1 = rad(p.lat);
  const lon1 = rad(p.lon);
  const b = rad(bearing);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: deg(lat2), lon: deg(lon2) };
}

function inPolygon(p: Coords, polygon: readonly [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if (
      yi > p.lat !== yj > p.lat &&
      p.lon < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi
    )
      inside = !inside;
  }
  return inside;
}

/** Garis kasar [lat, lon] pulau Sumatera dan Kalimantan (Borneo Indonesia). */
const REGIONS: Record<SmokeSource, [number, number][]> = {
  sumatera: [
    [5.9, 95.2],
    [5.3, 97.6],
    [3.9, 98.8],
    [2.3, 100.2],
    [1.2, 102.4],
    [0.5, 103.8],
    [-1.0, 104.6],
    [-3.0, 106.2],
    [-5.9, 105.9],
    [-5.9, 104.3],
    [-3.2, 101.6],
    [-1.0, 99.9],
    [1.5, 97.9],
    [3.6, 96.0],
    [5.5, 95.0],
  ],
  kalimantan: [
    [4.3, 117.6],
    [1.0, 119.0],
    [-1.0, 117.2],
    [-4.1, 116.1],
    [-3.6, 111.0],
    [-3.0, 110.0],
    [-1.0, 109.0],
    [0.9, 108.9],
    [1.6, 109.6],
    [1.0, 110.6],
    [1.0, 111.6],
    [1.4, 113.0],
    [2.0, 114.6],
    [3.0, 115.5],
    [4.2, 115.9],
  ],
};

/** Jarak maksimum ke hulu angin yang disemak (km). */
const UPWIND_KM = 600;

/** Kawasan Sumatera/Kalimantan pertama di hulu angin dalam 600 km, jika ada. */
export function smokeSource(point: Coords, from: number): SmokeSource | null {
  for (let km = 50; km <= UPWIND_KM; km += 50) {
    const p = destination(point, from, km);
    for (const [name, polygon] of Object.entries(REGIONS))
      if (inPolygon(p, polygon)) return name as SmokeSource;
  }
  return null;
}

/** Angin semasa (purata ±3 jam) dan anggaran asal jerebu bagi lokasi. */
export function windAt(
  series: WindSeries,
  point: Coords,
  nowKey: string,
): Wind | null {
  const mean = meanWind(series, nowKey);
  if (!mean) return null;
  const calm = mean.speed < CALM_KMH;
  return {
    ...mean,
    compass: compassOf(mean.direction),
    source: calm ? null : smokeSource(point, mean.direction),
  };
}
