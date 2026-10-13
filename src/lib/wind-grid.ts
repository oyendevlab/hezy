/**
 * Grid angin 850 hPa untuk lapisan aliran angin di peta (item 8, v0.7.0): 1° × 1° meliputi
 * Semenanjung, Sumatera utara, Borneo dan Laut China Selatan. Satu permintaan Open-Meteo
 * berbilang lokasi; disimpan sebagai komponen u/v (km/j) supaya mudah diinterpolasi.
 */
export const WIND_GRID = {
  lat0: 0.5,
  lon0: 99,
  step: 1,
  ny: 8,
  nx: 21,
} as const;

export type WindGrid = {
  lat0: number;
  lon0: number;
  step: number;
  nx: number;
  ny: number;
  /** Komponen timur (+) / barat (−), km/j, baris demi baris dari selatan (ny × nx). */
  u: number[];
  /** Komponen utara (+) / selatan (−), km/j. */
  v: number[];
  /** Jam data, waktu Malaysia `YYYY-MM-DDTHH:mm`. */
  time: string | null;
};

export function windGridPoints(
  grid = WIND_GRID,
): { lat: number; lon: number }[] {
  const points: { lat: number; lon: number }[] = [];
  for (let j = 0; j < grid.ny; j++)
    for (let i = 0; i < grid.nx; i++)
      points.push({
        lat: grid.lat0 + j * grid.step,
        lon: grid.lon0 + i * grid.step,
      });
  return points;
}

export function windGridUrl(grid = WIND_GRID): string {
  const points = windGridPoints(grid);
  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat).join(","),
    longitude: points.map((p) => p.lon).join(","),
    hourly: "wind_speed_850hPa,wind_direction_850hPa",
    forecast_hours: "1",
    wind_speed_unit: "kmh",
    timezone: "Asia/Kuala_Lumpur",
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

/**
 * Arah meteorologi ialah arah angin DATANG; vektor aliran menghala ke arah bertentangan.
 * u = −kelajuan·sin(arah), v = −kelajuan·cos(arah).
 */
export function toUV(speed: number, direction: number): [number, number] {
  const rad = (direction * Math.PI) / 180;
  return [-speed * Math.sin(rad), -speed * Math.cos(rad)];
}

const first = (v: unknown): number | null => {
  const x = Array.isArray(v) ? v[0] : null;
  return typeof x === "number" && Number.isFinite(x) ? x : null;
};

export function parseWindGrid(json: unknown, grid = WIND_GRID): WindGrid {
  const list = Array.isArray(json) ? json : [json];
  const n = grid.nx * grid.ny;
  if (list.length !== n) throw new Error("Grid angin tidak lengkap.");
  const u: number[] = [];
  const v: number[] = [];
  let time: string | null = null;
  for (const item of list) {
    const hourly = (item as { hourly?: Record<string, unknown> })?.hourly ?? {};
    const speed = first(hourly.wind_speed_850hPa) ?? 0;
    const dir = first(hourly.wind_direction_850hPa) ?? 0;
    const [a, b] = toUV(speed, dir);
    u.push(Math.round(a * 10) / 10);
    v.push(Math.round(b * 10) / 10);
    const t = Array.isArray(hourly.time) ? hourly.time[0] : null;
    if (!time && typeof t === "string") time = t;
  }
  return { ...grid, u, v, time };
}

/** Angin (u, v) di satu titik dengan interpolasi bilinear; `null` di luar grid. */
export function sampleWind(
  grid: WindGrid,
  lat: number,
  lon: number,
): [number, number] | null {
  const x = (lon - grid.lon0) / grid.step;
  const y = (lat - grid.lat0) / grid.step;
  if (x < 0 || y < 0 || x > grid.nx - 1 || y > grid.ny - 1) return null;
  const i = Math.min(Math.floor(x), grid.nx - 2);
  const j = Math.min(Math.floor(y), grid.ny - 2);
  const fx = x - i;
  const fy = y - j;
  const at = (arr: number[], ii: number, jj: number) => arr[jj * grid.nx + ii];
  const lerp = (arr: number[]) =>
    at(arr, i, j) * (1 - fx) * (1 - fy) +
    at(arr, i + 1, j) * fx * (1 - fy) +
    at(arr, i, j + 1) * (1 - fx) * fy +
    at(arr, i + 1, j + 1) * fx * fy;
  return [lerp(grid.u), lerp(grid.v)];
}
