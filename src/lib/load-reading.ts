import { after } from "next/server";
import type { HourlyOfficial, Station } from "./apims";
import { handled, withinBudget } from "./budget";
import type { Coords } from "./coords";
import {
  getAirQualityResilient,
  getStateHistory,
  getTwoPmReadings,
} from "./data";
import { addDays } from "./history";
import { officialFor, withOfficialHistory } from "./official";
import { buildReading, localHourKey, type Reading } from "./reading";
import {
  SCHOOL_DECISION_HOUR,
  SCHOOL_PROLONGED_DAYS,
  SCHOOL_PROLONGED_LIMIT,
} from "./school";

/**
 * Sel model 0.1°: Open-Meteo mengambil titik grid 0.1° terdekat, jadi nilainya sama untuk
 * semua koordinat dalam sel dan cache boleh dikongsi (v0.8.2).
 */
export function modelCell({ lat, lon }: Coords): Coords {
  return { lat: Math.round(lat * 10) / 10, lon: Math.round(lon * 10) / 10 };
}

export type LoadOptions = {
  /**
   * Had menunggu sejarah APIMS (ms). Tanpanya sejarah ditunggu sepenuhnya (semakan amaran);
   * dengan had, bacaan dipulangkan tanpa sejarah dan ditandakan `partial`.
   */
  historyBudgetMs?: number;
};

type StationList = readonly Station[] | null;

/**
 * Bacaan lengkap bagi koordinat: model Open-Meteo, bacaan rasmi APIMS stesen terdekat,
 * sejarah sejam (graf) dan ramalan yang dibetulkan. Digunakan oleh /api/aqi dan semakan amaran.
 * Model diminta serta-merta, selari dengan senarai stesen dan sejarah rasmi.
 */
export async function loadReading(
  coords: Coords,
  now: Date,
  stations: StationList | Promise<StationList>,
  options: LoadOptions = {},
): Promise<{
  reading: Reading;
  station: Station | undefined;
  /** Sebahagian data (sejarah rasmi) belum sempat diambil. */
  partial: boolean;
}> {
  const cell = modelCell(coords);
  const seriesPromise = handled(getAirQualityResilient(cell.lat, cell.lon));
  const nowKey = localHourKey(now);
  const list = await stations;
  const official = list ? officialFor([...list], coords, nowKey) : null;
  const station = official
    ? list?.find((s) => s.id === official.stationId)
    : undefined;
  const [series, history] = await Promise.all([
    seriesPromise,
    officialHistory(station, nowKey, options.historyBudgetMs),
  ]);
  let reading = buildReading(series, now, history.hours);
  reading.official = official;
  reading = withOfficialHistory(reading, history.hours);
  if (station)
    reading.schoolTwoPm = await schoolTwoPm(station.id, history.hours, nowKey);
  return { reading, station, partial: history.late };
}

/** Sejarah 25 jam stesen; bila melepasi had, dibiar siap selepas respons untuk mengisi cache. */
async function officialHistory(
  station: Station | undefined,
  nowKey: string,
  budgetMs: number | undefined,
): Promise<{ hours: HourlyOfficial[]; late: boolean }> {
  if (station?.stateId == null) return { hours: [], late: false };
  const pending = getStateHistory(station.stateId, nowKey).then(
    (byStation) => byStation[station.id] ?? [],
  );
  const result =
    budgetMs === undefined
      ? await pending.then(
          (value) => ({ status: "ok" as const, value }),
          (error: unknown) => ({ status: "error" as const, error }),
        )
      : await withinBudget(pending, budgetMs);
  if (result.status === "ok") return { hours: result.value, late: false };
  if (result.status === "late") {
    after(() => pending.catch(() => undefined));
    return { hours: [], late: true };
  }
  console.error("[loadReading] APIMS sejarah", result.error);
  return { hours: [], late: false };
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
