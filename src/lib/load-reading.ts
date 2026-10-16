import { after } from "next/server";
import type { HourlyOfficial, Station } from "./apims";
import { handled, withinBudget } from "./budget";
import type { Coords } from "./coords";
import {
  getAirQualityResilient,
  getStateHistory,
  getStationModels,
  getTwoPmReadings,
} from "./data";
import { addDays } from "./history";
import { officialFor, withOfficialHistory } from "./official";
import { buildReading, localHourKey, type Reading } from "./reading";
import {
  applySpatialBias,
  idwBias,
  stationBiases,
  type SpatialBias,
} from "./spatial-bias";
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
   * Had menunggu sejarah APIMS dan model stesen (ms). Tanpanya ditunggu sepenuhnya (semakan
   * amaran); dengan had, bacaan dipulangkan tanpanya dan ditandakan `partial`.
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
  /** Sebahagian data (sejarah rasmi atau model stesen) belum sempat diambil. */
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
  // Tiada bacaan rasmi dalam 30 km: betulkan model dengan bias stesen berdekatan (v0.8.5).
  const spatialPending =
    !official && list && list.length > 0
      ? getStationModels(
          list.map((s) => ({ id: s.id, lat: s.lat, lon: s.lon })),
        ).then((models) => idwBias(coords, stationBiases(list, models, nowKey)))
      : null;
  const historyPending =
    station?.stateId != null
      ? getStateHistory(station.stateId, nowKey).then(
          (byStation) => byStation[station.id] ?? [],
        )
      : null;
  const [series, history, spatial] = await Promise.all([
    seriesPromise,
    settle(historyPending, options.historyBudgetMs, "APIMS sejarah"),
    settle(spatialPending, options.historyBudgetMs, "model stesen"),
  ]);
  const hours = history.value ?? [];
  const bias = spatial.value;
  let reading = buildReading(
    bias ? applySpatialBias(series, bias) : series,
    now,
    hours,
  );
  reading.official = official;
  reading = withOfficialHistory(reading, hours);
  if (bias) reading = withSpatial(reading, bias);
  if (station)
    reading.schoolTwoPm = await schoolTwoPm(station.id, hours, nowKey);
  return { reading, station, partial: history.late || spatial.late };
}

/** Tandakan bacaan yang dibetulkan dengan bias ruang (label "dibetulkan" dalam graf). */
function withSpatial(reading: Reading, bias: SpatialBias): Reading {
  return {
    ...reading,
    today: reading.today.map((h) => ({ ...h, corrected: true })),
    spatial: {
      stations: bias.stations,
      nearestName: bias.nearestName,
      nearestKm: bias.nearestKm,
    },
  };
}

/**
 * Tunggu sumber tambahan, paling lama `budgetMs` (tanpa had: tunggu sepenuhnya). Yang lambat
 * dibiar siap selepas respons untuk mengisi cache; yang gagal dilog dan diabaikan.
 */
async function settle<T>(
  pending: Promise<T> | null,
  budgetMs: number | undefined,
  label: string,
): Promise<{ value: T | null; late: boolean }> {
  if (!pending) return { value: null, late: false };
  const result =
    budgetMs === undefined
      ? await pending.then(
          (value) => ({ status: "ok" as const, value }),
          (error: unknown) => ({ status: "error" as const, error }),
        )
      : await withinBudget(pending, budgetMs);
  if (result.status === "ok") return { value: result.value, late: false };
  if (result.status === "late") {
    after(() => pending.catch(() => undefined));
    return { value: null, late: true };
  }
  console.error(`[loadReading] ${label}`, result.error);
  return { value: null, late: false };
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
