import { cacheLife } from "next/cache";
import { APIMS_STATIONS_URL, parseStations, type Station } from "./apims";
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

/** Senarai stesen APIMS dengan bacaan terkini, dicache 15 minit (satu permintaan ke JAS bagi semua pengguna). */
export async function getStations(): Promise<Station[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });

  const res = await fetch(APIMS_STATIONS_URL, {
    headers: { "User-Agent": "Hezy/0.1 (+https://hezy.vercel.app)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`APIMS memulangkan status ${res.status}`);
  }
  return parseStations(await res.json());
}
