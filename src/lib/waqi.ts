/**
 * Lapisan sensor tambahan daripada World Air Quality Index Project (aqicn.org).
 * Ikut terma WAQI: diambil terus dari pelayar (tiada cache pelayan) dan dipaparkan
 * dengan atribusi. Nilai ialah AQI skala AS (bukan IPU), jadi hanya dipaparkan
 * sebagai lapisan berasingan; nombor utama dan amaran kekal guna IPU rasmi.
 */

import { distanceKm, type Station } from "./apims";
import { MALAYSIA_BOUNDS, isInMalaysia } from "./coords";

export const WAQI_TOKEN = process.env.NEXT_PUBLIC_WAQI_TOKEN ?? "";

/** Bacaan lebih lama daripada ini dianggap lapuk dan tidak dipaparkan. */
export const MAX_SENSOR_AGE_HOURS = 3;
/** Stesen rasmi WAQI dalam jarak ini daripada stesen APIMS ialah pendua. */
const DUPLICATE_KM = 5;

export type Sensor = {
  uid: number;
  name: string;
  lat: number;
  lon: number;
  /** AQI skala AS. */
  aqi: number;
  /** Masa bacaan, waktu Malaysia `YYYY-MM-DDTHH:mm`. */
  time: string;
};

export function waqiBoundsUrl(token: string): string {
  const b = MALAYSIA_BOUNDS;
  return `https://api.waqi.info/v2/map/bounds?latlng=${b.minLat},${b.minLon},${b.maxLat},${b.maxLon}&networks=all&token=${encodeURIComponent(token)}`;
}

/** Nama yang jelas di luar Malaysia (kotak sempadan turut meliputi selatan Thailand, Singapura dan Indonesia). */
const FOREIGN = /[฀-๿]|thailand|singapore|indonesia|kabupaten|\bkota\b|brunei/i;

type RawSensor = {
  lat?: unknown;
  lon?: unknown;
  uid?: unknown;
  aqi?: unknown;
  station?: { name?: unknown; time?: unknown };
};

/**
 * Tapis respons `map/bounds`: hanya Malaysia, AQI bernombor, bacaan ≤ 3 jam,
 * dan buang stesen rasmi yang sudah ada dalam APIMS.
 */
export function parseSensors(
  body: unknown,
  apims: Station[],
  now: Date,
): Sensor[] {
  const b = body as { status?: unknown; data?: unknown } | null;
  if (b?.status !== "ok" || !Array.isArray(b.data)) return [];
  const sensors: Sensor[] = [];
  for (const raw of b.data as RawSensor[]) {
    const lat = Number(raw.lat);
    const lon = Number(raw.lon);
    const uid = Number(raw.uid);
    const aqi = Number(raw.aqi);
    const name = typeof raw.station?.name === "string" ? raw.station.name : "";
    const time =
      typeof raw.station?.time === "string"
        ? Date.parse(raw.station.time)
        : NaN;
    if (![lat, lon, uid, aqi, time].every(Number.isFinite)) continue;
    if (aqi < 0 || aqi > 999 || !name || FOREIGN.test(name)) continue;
    if (!isInMalaysia({ lat, lon })) continue;
    if (now.getTime() - time > MAX_SENSOR_AGE_HOURS * 3_600_000) continue;
    // uid positif = rangkaian rasmi (cth. JAS); uid negatif = sensor komuniti.
    if (
      uid > 0 &&
      apims.some((s) => distanceKm({ lat, lon }, s) <= DUPLICATE_KM)
    )
      continue;
    sensors.push({
      uid,
      name: name.trim().slice(0, 80),
      lat,
      lon,
      aqi: Math.round(aqi),
      time: new Date(time + 8 * 3_600_000).toISOString().slice(0, 16),
    });
  }
  return sensors;
}
