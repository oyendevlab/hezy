import { nearestStation, type HourlyOfficial, type Station } from "./apims";
import { ipuCategory, isEmergency, type IpuCategoryKey } from "./ipu";
import type { Reading } from "./reading";

/** Bacaan rasmi lebih lama daripada ini (jam) tidak digunakan. */
export const OFFICIAL_MAX_AGE_HOURS = 3;
/** Jarak maksimum stesen APIMS daripada lokasi pengguna. */
export const OFFICIAL_MAX_KM = 30;

export type OfficialReading = {
  stationId: string;
  stationName: string;
  distanceKm: number;
  ipu: number;
  category: IpuCategoryKey;
  label: string;
  emergency: boolean;
  pollutant: string | null;
  time: string;
};

const hoursBetween = (a: string, b: string) =>
  (Date.parse(`${b}:00Z`) - Date.parse(`${a}:00Z`)) / 3_600_000;

/**
 * Bacaan rasmi stesen terdekat, atau null jika tiada stesen dalam `maxKm` dengan bacaan
 * terkini. `maxKm` lebih jauh hanya untuk rujukan (cth. stesen terdekat tanah tinggi, v0.8.12).
 */
export function officialFor(
  stations: readonly Station[],
  point: { lat: number; lon: number },
  nowKey: string,
  maxKm = OFFICIAL_MAX_KM,
): OfficialReading | null {
  const nearest = nearestStation(stations, point, maxKm);
  const ipu = nearest?.station.ipu ?? null;
  const time = nearest?.station.time ?? null;
  if (!nearest || ipu === null || time === null) return null;
  if (hoursBetween(time, nowKey) > OFFICIAL_MAX_AGE_HOURS) return null;
  const category = ipuCategory(ipu);
  return {
    stationId: nearest.station.id,
    stationName: nearest.station.name,
    distanceKm: Math.round(nearest.distanceKm * 10) / 10,
    ipu,
    category: category.key,
    label: category.label,
    emergency: isEmergency(ipu),
    pollutant: nearest.station.pollutant,
    time,
  };
}

/** Nombor utama yang dipaparkan: rasmi jika ada, jika tidak anggaran model. */
export type PrimaryReading = {
  ipu: number;
  category: IpuCategoryKey;
  label: string;
  emergency: boolean;
  time: string;
  source: "apims" | "model";
};

export function primaryReading(
  reading: Pick<Reading, "current" | "official"> | undefined,
): PrimaryReading | null {
  if (reading?.official) {
    const o = reading.official;
    return {
      ipu: o.ipu,
      category: o.category,
      label: o.label,
      emergency: o.emergency,
      time: o.time,
      source: "apims",
    };
  }
  const c = reading?.current;
  if (!c) return null;
  return {
    ipu: c.ipu,
    category: c.category,
    label: c.label,
    emergency: c.emergency,
    time: c.time,
    source: "model",
  };
}

/** Lampirkan IPU rasmi setiap jam pada jam hari ini yang sudah lepas. */
export function withOfficialHistory(
  reading: Reading,
  history: readonly HourlyOfficial[],
): Reading {
  const byTime = new Map(history.map((h) => [h.time, h.ipu]));
  return {
    ...reading,
    today: reading.today.map((h) =>
      h.forecast ? h : { ...h, officialIpu: byTime.get(h.time) ?? null },
    ),
  };
}

/**
 * Nilai IPU yang dipaparkan bagi satu jam — graf, ramalan per jam, ringkasan harian, kad kongsi
 * dan amaran (unit JAS di semua paparan sejak v0.8.7): rasmi APIMS bagi jam lepas, model E bagi
 * jam yang belum diterbitkan. Bacaan lama tersimpan (tanpa `jasIpu`) guna IPU sejam untuk
 * ramalan dan purata 24 jam model untuk jam lepas.
 */
export function displayIpu(h: {
  forecast: boolean;
  ipu?: number | null;
  hourlyIpu: number | null;
  officialIpu?: number | null;
  jasIpu?: number | null;
}): number | null {
  if (!h.forecast && h.officialIpu != null) return h.officialIpu;
  if (h.jasIpu !== undefined) return h.jasIpu;
  return h.forecast ? h.hourlyIpu : (h.ipu ?? h.hourlyIpu);
}
