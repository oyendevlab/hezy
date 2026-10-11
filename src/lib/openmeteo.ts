/** Klien Open-Meteo Air Quality API (tanpa kunci API). https://open-meteo.com/en/docs/air-quality-api */

const ENDPOINT = "https://air-quality-api.open-meteo.com/v1/air-quality";

/** Data PM2.5 sejam. `times` dalam waktu tempatan Asia/Kuala_Lumpur, format `YYYY-MM-DDTHH:mm`. */
export type AirQualitySeries = { times: string[]; pm25: (number | null)[] };

export function airQualityUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "pm2_5",
    timezone: "Asia/Kuala_Lumpur",
    // 2 hari lepas cukup untuk purata 24 jam bagi setiap jam hari ini.
    past_days: "2",
    forecast_days: "2",
  });
  return `${ENDPOINT}?${params}`;
}

export function parseAirQuality(json: unknown): AirQualitySeries {
  const hourly = (
    json as { hourly?: { time?: unknown; pm2_5?: unknown } } | null
  )?.hourly;
  const times = hourly?.time;
  const pm25 = hourly?.pm2_5;
  if (
    !Array.isArray(times) ||
    !Array.isArray(pm25) ||
    times.length !== pm25.length
  ) {
    throw new Error(
      "Respons Open-Meteo tidak dijangka: hourly.time / hourly.pm2_5 tiada.",
    );
  }
  return {
    times: times.map(String),
    pm25: pm25.map((v) =>
      typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null,
    ),
  };
}
