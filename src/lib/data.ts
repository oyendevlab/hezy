import { cacheLife } from "next/cache";
import {
  airQualityUrl,
  parseAirQuality,
  type AirQualitySeries,
} from "./openmeteo";

/** Ambil siri PM2.5 untuk koordinat, dicache 15 minit di pelayan. */
export async function getAirQuality(
  lat: number,
  lon: number,
): Promise<AirQualitySeries> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });

  const res = await fetch(airQualityUrl(lat, lon));
  if (!res.ok) {
    throw new Error(`Open-Meteo memulangkan status ${res.status}`);
  }
  return parseAirQuality(await res.json());
}
