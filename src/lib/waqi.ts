/**
 * Lapisan sensor tambahan daripada World Air Quality Index Project (aqicn.org).
 * Sejak v0.8.6 diambil melalui /api/waqi (token di pelayan sahaja) tanpa sebarang cache, ikut
 * terma WAQI yang melarang data diedarkan semula sebagai cache; dipaparkan dengan atribusi.
 * Nilai ialah AQI skala AS (bukan IPU), jadi hanya dipaparkan sebagai lapisan berasingan;
 * nombor utama dan amaran kekal guna IPU rasmi.
 */

import { distanceKm, type Station } from "./apims";
import { MALAYSIA_BOUNDS, isInMalaysia } from "./coords";
import { pm25ToIpu } from "./ipu";
import { MAP_REGION } from "./wind-grid";

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

/** Seluruh rantau peta (Asia Tenggara) — untuk taburan IPU di luar Malaysia. */
export function waqiRegionUrl(token: string): string {
  const r = MAP_REGION;
  return `https://api.waqi.info/v2/map/bounds?latlng=${r.south},${r.west},${r.north},${r.east}&networks=all&token=${encodeURIComponent(token)}`;
}

/**
 * Titik breakpoint PM2.5 (µg/m³) ↔ AQI AS. WAQI menyatakan skala PM2.5 mereka ialah piawai
 * EPA 2012 (aqicn.org/faq/2013-09-09/revised-pm25-aqi-breakpoints), bukan kemas kini EPA 2024.
 */
const US_AQI_PM25: readonly [number, number, number, number][] = [
  [0, 50, 0, 12.0],
  [51, 100, 12.1, 35.4],
  [101, 150, 35.5, 55.4],
  [151, 200, 55.5, 150.4],
  [201, 300, 150.5, 250.4],
  [301, 400, 250.5, 350.4],
  [401, 500, 350.5, 500.4],
];

/** AQI AS → kepekatan PM2.5 setara (songsangan formula US EPA, diapit 0–500). */
export function usAqiToPm25(aqi: number): number {
  const a = Math.min(Math.max(aqi, 0), 500);
  const band =
    US_AQI_PM25.find(([, hi]) => a <= hi) ??
    US_AQI_PM25[US_AQI_PM25.length - 1];
  const [ilo, ihi, clo, chi] = band;
  return Math.round((((a - ilo) / (ihi - ilo)) * (chi - clo) + clo) * 10) / 10;
}

export type RegionPoint = { lat: number; lon: number; ipu: number };

/**
 * Sensor WAQI di LUAR Malaysia untuk taburan IPU (di Malaysia hanya APIMS rasmi digunakan):
 * AQI AS ditukar ke PM2.5 kemudian ke skala IPU — anggaran, kerana semasa jerebu PM2.5
 * hampir sentiasa pencemar utama. Bacaan ≤ 3 jam sahaja.
 */
export function parseRegionSensors(body: unknown, now: Date): RegionPoint[] {
  const b = body as { status?: unknown; data?: unknown } | null;
  if (b?.status !== "ok" || !Array.isArray(b.data)) return [];
  const points: RegionPoint[] = [];
  for (const raw of b.data as RawSensor[]) {
    const lat = Number(raw.lat);
    const lon = Number(raw.lon);
    const aqi = Number(raw.aqi);
    const name = typeof raw.station?.name === "string" ? raw.station.name : "";
    const time =
      typeof raw.station?.time === "string"
        ? Date.parse(raw.station.time)
        : NaN;
    if (![lat, lon, aqi, time].every(Number.isFinite)) continue;
    if (aqi < 0 || aqi > 999) continue;
    if (now.getTime() - time > MAX_SENSOR_AGE_HOURS * 3_600_000) continue;
    if (isInMalaysia({ lat, lon }) && !FOREIGN.test(name)) continue;
    points.push({ lat, lon, ipu: pm25ToIpu(usAqiToPm25(aqi)) });
  }
  return points;
}
