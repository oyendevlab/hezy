/**
 * Bacaan rasmi IPU daripada portal APIMS (JAS).
 * Sumber: endpoint JSON awam yang digunakan oleh https://eqms.doe.gov.my/APIMS/main.
 * Endpoint ini tidak didokumenkan secara rasmi, jadi bentuknya disahkan setiap kali dibaca.
 */

export const APIMS_STATIONS_URL =
  "https://eqms.doe.gov.my/api3/publicportalapims/mapcaqm";

/** Simbol pencemar dominan seperti dalam legenda portal APIMS. */
const POLLUTANTS: Record<string, string> = {
  "**": "PM2.5",
  "*": "PM10",
  a: "SO₂",
  b: "NO₂",
  c: "O₃",
  d: "CO",
  "&": "Pelbagai",
};

export type Station = {
  id: string;
  /** Nama lokasi stesen, cth. "Shah Alam". */
  name: string;
  state: string;
  /** ID negeri APIMS (untuk sejarah setiap jam). */
  stateId: number | null;
  lat: number;
  lon: number;
  /** IPU rasmi; `null` bila stesen tiada bacaan (N/A). */
  ipu: number | null;
  pollutant: string | null;
  /** Masa bacaan, waktu Malaysia `YYYY-MM-DDTHH:mm`. */
  time: string | null;
};

type RawStation = {
  STATION_ID?: unknown;
  STATE_NAME?: unknown;
  STATE_ID?: unknown;
  STATION_LOCATION?: unknown;
  LATITUDE?: unknown;
  LONGITUDE?: unknown;
  API?: unknown;
  PARAM_SYMBOL?: unknown;
  RECORD_DT?: unknown;
};

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/(^|[\s/(.-])(\p{L})/gu, (_, p, c: string) => p + c.toUpperCase());

export function parseStations(json: unknown): Station[] {
  const rows = (json as { data?: unknown } | null)?.data;
  if (!Array.isArray(rows)) {
    throw new Error("Respons APIMS tidak dijangka: medan data tiada.");
  }
  return rows.flatMap((row: RawStation): Station[] => {
    const lat = Number(row.LATITUDE);
    const lon = Number(row.LONGITUDE);
    if (
      typeof row.STATION_ID !== "string" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    )
      return [];
    const location =
      typeof row.STATION_LOCATION === "string"
        ? row.STATION_LOCATION
        : row.STATION_ID;
    const ipu =
      typeof row.API === "number" && Number.isFinite(row.API) && row.API >= 0
        ? Math.round(row.API)
        : null;
    const symbol =
      typeof row.PARAM_SYMBOL === "string" ? row.PARAM_SYMBOL.trim() : "";
    const time =
      typeof row.RECORD_DT === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(row.RECORD_DT)
        ? row.RECORD_DT.slice(0, 16)
        : null;
    return [
      {
        id: row.STATION_ID,
        name: titleCase(location.split(",")[0].trim()),
        state: typeof row.STATE_NAME === "string" ? row.STATE_NAME : "",
        stateId: typeof row.STATE_ID === "number" ? row.STATE_ID : null,
        lat,
        lon,
        ipu,
        pollutant: ipu === null ? null : (POLLUTANTS[symbol] ?? null),
        time: ipu === null ? null : time,
      },
    ];
  });
}

/** Jarak bulatan besar dalam km. */
export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Stesen terdekat yang mempunyai bacaan, dalam lingkungan `maxKm`. */
export function nearestStation(
  stations: readonly Station[],
  point: { lat: number; lon: number },
  maxKm = 30,
): { station: Station; distanceKm: number } | null {
  let best: { station: Station; distanceKm: number } | null = null;
  for (const station of stations) {
    if (station.ipu === null) continue;
    const d = distanceKm(point, station);
    if (d <= maxKm && (best === null || d < best.distanceKm))
      best = { station, distanceKm: d };
  }
  return best;
}

/** URL sejarah IPU setiap jam (25 jam hingga `hourKey`) bagi semua stesen dalam satu negeri. */
export function apimsHourlyUrl(stateId: number, hourKey: string): string {
  return `https://eqms.doe.gov.my/api3/publicportalapims/apitablehourly?stateid=${stateId}&datetime=${hourKey}:00&`;
}

export type HourlyOfficial = { time: string; ipu: number | null };

/** Sejarah setiap jam mengikut stesen, disusun dari awal ke akhir. */
export function parseHourly(json: unknown): Map<string, HourlyOfficial[]> {
  const rows = (json as { api_table_hourly?: unknown } | null)
    ?.api_table_hourly;
  if (!Array.isArray(rows)) {
    throw new Error("Respons APIMS tidak dijangka: api_table_hourly tiada.");
  }
  const byStation = new Map<string, HourlyOfficial[]>();
  for (const row of rows as {
    STATION_ID?: unknown;
    DATETIME?: unknown;
    API?: unknown;
  }[]) {
    if (typeof row.STATION_ID !== "string" || typeof row.DATETIME !== "string")
      continue;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(row.DATETIME)) continue;
    const ipu =
      typeof row.API === "number" && Number.isFinite(row.API) && row.API >= 0
        ? Math.round(row.API)
        : null;
    const list = byStation.get(row.STATION_ID) ?? [];
    list.push({ time: row.DATETIME.slice(0, 16), ipu });
    byStation.set(row.STATION_ID, list);
  }
  for (const list of byStation.values())
    list.sort((a, b) => a.time.localeCompare(b.time));
  return byStation;
}
