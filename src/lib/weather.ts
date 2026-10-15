/**
 * Cuaca semasa dan harian daripada Open-Meteo Forecast API (tanpa token) untuk langit hidup,
 * ikon cuaca dan angin 850 hPa (item 1). Satu permintaan bagi setiap lokasi.
 */

import type { WindSeries } from "./wind";

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

export type WeatherSeries = WindSeries & {
  cloud: (number | null)[];
  /** meter */
  visibility: (number | null)[];
  temperature: (number | null)[];
  code: (number | null)[];
  isDay: (number | null)[];
  precipitation: (number | null)[];
  /** Angin permukaan (10 m), km/j dan arah datang (darjah), untuk ramalan per jam. */
  windSpeed10: (number | null)[];
  windDir10: (number | null)[];
  days: DayWeather[];
  /** Matahari terbit/terbenam ikut tarikh, `YYYY-MM-DDTHH:mm` waktu Malaysia. */
  sun: Record<string, { rise: string; set: string }>;
};

export type DayWeather = {
  date: string;
  code: number;
  max: number;
  min: number;
  /** Kebarangkalian hujan maksimum hari itu (%). */
  rainChance?: number | null;
  /** Angin permukaan maksimum (km/j) dan arah dominan (darjah datang). */
  windMax?: number | null;
  windDir?: number | null;
};

export type CurrentWeather = {
  time: string;
  temperature: number;
  /** Kod cuaca WMO. */
  code: number;
  /** % */
  cloud: number;
  visibilityKm: number | null;
  isDay: boolean;
  /** mm sejam */
  precipitation: number;
  sunrise: string | null;
  sunset: string | null;
};

export function weatherUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly:
      "wind_speed_850hPa,wind_direction_850hPa,cloud_cover,visibility,temperature_2m,weather_code,is_day,precipitation,wind_speed_10m,wind_direction_10m",
    daily:
      "sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant",
    wind_speed_unit: "kmh",
    timezone: "Asia/Kuala_Lumpur",
    past_days: "1",
    forecast_days: "5",
  });
  return `${ENDPOINT}?${params}`;
}

const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export function parseWeather(json: unknown): WeatherSeries {
  const r = json as {
    hourly?: Record<string, unknown>;
    daily?: Record<string, unknown>;
  } | null;
  const h = r?.hourly;
  const times = h?.time;
  if (!Array.isArray(times)) {
    throw new Error("Respons cuaca Open-Meteo tidak dijangka.");
  }
  const col = (key: string) => {
    const v = h?.[key];
    if (!Array.isArray(v) || v.length !== times.length) {
      throw new Error(`Respons cuaca Open-Meteo tiada ${key}.`);
    }
    return v.map(num);
  };
  const optionalCol = (key: string) => {
    const v = h?.[key];
    return Array.isArray(v) && v.length === times.length
      ? v.map(num)
      : times.map(() => null);
  };
  const d = r?.daily ?? {};
  const dTimes = Array.isArray(d.time) ? (d.time as unknown[]).map(String) : [];
  const dCol = (key: string) =>
    Array.isArray(d[key]) ? (d[key] as unknown[]) : [];
  const days: DayWeather[] = [];
  const sun: WeatherSeries["sun"] = {};
  dTimes.forEach((date, i) => {
    const code = num(dCol("weather_code")[i]);
    const max = num(dCol("temperature_2m_max")[i]);
    const min = num(dCol("temperature_2m_min")[i]);
    if (code !== null && max !== null && min !== null) {
      const rain = num(dCol("precipitation_probability_max")[i]);
      const windMax = num(dCol("wind_speed_10m_max")[i]);
      days.push({
        date,
        code,
        max: Math.round(max),
        min: Math.round(min),
        rainChance: rain === null ? null : Math.round(rain),
        windMax: windMax === null ? null : Math.round(windMax),
        windDir: num(dCol("wind_direction_10m_dominant")[i]),
      });
    }
    const rise = dCol("sunrise")[i];
    const set = dCol("sunset")[i];
    if (typeof rise === "string" && typeof set === "string")
      sun[date] = { rise: rise.slice(0, 16), set: set.slice(0, 16) };
  });
  return {
    times: times.map(String),
    speed: col("wind_speed_850hPa"),
    direction: col("wind_direction_850hPa"),
    cloud: col("cloud_cover"),
    visibility: col("visibility"),
    temperature: col("temperature_2m"),
    code: col("weather_code"),
    isDay: col("is_day"),
    precipitation: col("precipitation"),
    // Medan baharu (v0.7.4): tidak wajib supaya respons lama/ujian tidak gagal.
    windSpeed10: optionalCol("wind_speed_10m"),
    windDir10: optionalCol("wind_direction_10m"),
    days,
    sun,
  };
}

/** Cuaca bagi jam semasa (`nowKey`), atau null jika tiada data. */
export function currentWeather(
  series: WeatherSeries,
  nowKey: string,
): CurrentWeather | null {
  const i = series.times.indexOf(nowKey);
  if (i < 0) return null;
  const temperature = series.temperature[i];
  const code = series.code[i];
  if (temperature === null || code === null) return null;
  const vis = series.visibility[i];
  const sun = series.sun[nowKey.slice(0, 10)];
  return {
    time: nowKey,
    temperature: Math.round(temperature),
    code,
    cloud: series.cloud[i] ?? 0,
    visibilityKm: vis === null ? null : Math.round(vis / 100) / 10,
    isDay: series.isDay[i] === 1,
    precipitation: series.precipitation[i] ?? 0,
    sunrise: sun?.rise ?? null,
    sunset: sun?.set ?? null,
  };
}

export type WeatherKind =
  "cerah" | "separa" | "mendung" | "kabus" | "gerimis" | "hujan" | "ribut";

/** Kumpulan kod WMO kepada jenis cuaca untuk ikon dan label. */
export function weatherKind(code: number): WeatherKind {
  if (code >= 95) return "ribut";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "hujan";
  if (code >= 51 && code <= 57) return "gerimis";
  if (code === 45 || code === 48) return "kabus";
  if (code === 3) return "mendung";
  if (code === 1 || code === 2) return "separa";
  return "cerah";
}

export const WEATHER_LABEL: Record<WeatherKind, string> = {
  cerah: "Cerah",
  separa: "Separa berawan",
  mendung: "Mendung",
  kabus: "Berkabus",
  gerimis: "Gerimis",
  hujan: "Hujan",
  ribut: "Ribut petir",
};

/** Hujan atau ribut: jarak penglihatan rendah bukan disebabkan jerebu. */
export const isWet = (code: number, precipitation = 0) =>
  precipitation >= 0.2 ||
  ["gerimis", "hujan", "ribut"].includes(weatherKind(code));
