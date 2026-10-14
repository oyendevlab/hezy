import type { HourlyOfficial, Station } from "./apims";
import type { Coords } from "./coords";
import { getAirQuality, getStateHistory, getTwoPmReadings } from "./data";
import { addDays } from "./history";
import { officialFor, withOfficialHistory } from "./official";
import { buildReading, localHourKey, type Reading } from "./reading";
import {
  SCHOOL_DECISION_HOUR,
  SCHOOL_PROLONGED_DAYS,
  SCHOOL_PROLONGED_LIMIT,
} from "./school";

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
  if (station)
    reading.schoolTwoPm = await schoolTwoPm(station.id, history, nowKey);
  return { reading, station };
}

/**
 * IPU jam 2 petang stesen bagi SCHOOL_PROLONGED_DAYS hari (lama → hari ini) untuk jangkaan
 * penutupan sekolah. Hari ini daripada sejarah 25 jam APIMS; hari sebelumnya daripada Blob
 * sejarah, hanya bila bacaan hari ini melebihi ambang (jimat permintaan).
 */
async function schoolTwoPm(
  stationId: string,
  history: readonly HourlyOfficial[],
  nowKey: string,
): Promise<(number | null)[]> {
  const today = nowKey.slice(0, 10);
  const at = (date: string) =>
    history.find(
      (h) =>
        h.time.slice(0, 13) ===
        `${date}T${String(SCHOOL_DECISION_HOUR).padStart(2, "0")}`,
    )?.ipu ?? null;
  const days = Array.from({ length: SCHOOL_PROLONGED_DAYS }, (_, i) =>
    addDays(today, i - SCHOOL_PROLONGED_DAYS + 1),
  );
  const todayIpu = at(today);
  if (todayIpu === null || todayIpu <= SCHOOL_PROLONGED_LIMIT)
    return days.map((d) => (d === today ? todayIpu : null));
  return Promise.all(
    days.map(async (date) => {
      if (date === today) return todayIpu;
      const fromHistory = at(date);
      if (fromHistory !== null) return fromHistory;
      try {
        return (await getTwoPmReadings(date))[stationId] ?? null;
      } catch {
        return null;
      }
    }),
  );
}
