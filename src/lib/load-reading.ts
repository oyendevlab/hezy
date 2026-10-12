import type { HourlyOfficial, Station } from "./apims";
import type { Coords } from "./coords";
import { getAirQuality, getStateHistory } from "./data";
import { officialFor, withOfficialHistory } from "./official";
import { buildReading, localHourKey, type Reading } from "./reading";

/**
 * Bacaan lengkap bagi koordinat: model Open-Meteo, bacaan rasmi APIMS stesen terdekat,
 * sejarah sejam (graf) dan ramalan yang dibetulkan. Digunakan oleh /api/aqi dan semakan amaran.
 */
export async function loadReading(
  coords: Coords,
  now: Date,
  stations: readonly Station[] | null,
): Promise<{ reading: Reading; station: Station | undefined }> {
  const series = await getAirQuality(coords.lat, coords.lon);
  const nowKey = localHourKey(now);
  const official = stations ? officialFor([...stations], coords, nowKey) : null;
  const station = official
    ? stations?.find((s) => s.id === official.stationId)
    : undefined;
  let history: HourlyOfficial[] = [];
  if (station?.stateId != null) {
    try {
      history =
        (await getStateHistory(station.stateId, nowKey))[station.id] ?? [];
    } catch (error) {
      console.error("[loadReading] APIMS sejarah", error);
    }
  }
  let reading = buildReading(series, now, history);
  reading.official = official;
  reading = withOfficialHistory(reading, history);
  return { reading, station };
}
