import type { AlertState } from "./alert";
import type { Lang } from "./i18n";
import {
  DEFAULT_ALERT_THRESHOLD,
  type AlertLocation,
  type AlertThreshold,
  type PushOptions,
  type PushSubscriptionData,
  type SubscribeInput,
} from "./push-validate";

/** Lokasi dalam rekod langganan bersama status amarannya sendiri. */
export type RecordLocation = AlertLocation &
  AlertState & {
    /** Tarikh (waktu Malaysia) amaran ramalan terakhir dihantar. */
    lastForecast?: string | null;
    /** Jam (waktu Malaysia `YYYY-MM-DDTHH:00`) amaran lonjakan terakhir. */
    lastSpike?: string | null;
    /** Tarikh (waktu Malaysia) amaran jerebu dijangka terakhir. */
    lastExpected?: string | null;
    /** Tarikh (waktu Malaysia) notifikasi sekolah mungkin ditutup esok terakhir. */
    lastSchool?: string | null;
  };

/** Rekod langganan dalam Vercel Blob (private): satu fail JSON bagi setiap peranti. */
export type PushRecord = {
  subscription: PushSubscriptionData;
  threshold: AlertThreshold;
  /** Bahasa notifikasi; rekod sebelum v0.3.0 tiada medan ini (BM). */
  lang?: Lang;
  locations: RecordLocation[];
  createdAt: string;
  /** Pilihan rutin; tiada dalam rekod sebelum v0.4.0. */
  options?: PushOptions;
  /** Tarikh (waktu Malaysia) ringkasan pagi terakhir dihantar. */
  lastMorning?: string | null;
};

/** Bentuk rekod sebelum v0.3.0: satu lokasi di aras atas, tanpa ambang. */
type LegacyRecord = {
  subscription: PushSubscriptionData;
  lat: number;
  lon: number;
  locationName: string;
  threshold?: AlertThreshold;
  createdAt: string;
} & AlertState;

/** Tukar rekod lama kepada bentuk semasa. */
export function normalizeRecord(raw: PushRecord | LegacyRecord): PushRecord {
  if ("locations" in raw && Array.isArray(raw.locations)) {
    return { ...raw, threshold: raw.threshold ?? DEFAULT_ALERT_THRESHOLD };
  }
  const legacy = raw as LegacyRecord;
  return {
    subscription: legacy.subscription,
    threshold: legacy.threshold ?? DEFAULT_ALERT_THRESHOLD,
    createdAt: legacy.createdAt,
    locations: [
      {
        id: "semasa",
        name: legacy.locationName,
        lat: legacy.lat,
        lon: legacy.lon,
        lastAlertKey: legacy.lastAlertKey ?? null,
        lastAlertAt: legacy.lastAlertAt ?? null,
      },
    ],
  };
}

/**
 * Gabung langganan baharu dengan rekod sedia ada. Status amaran dikekalkan bagi lokasi
 * yang sama (ikut id, atau koordinat yang sama) supaya amaran tidak berganda.
 */
export function mergeRecord(
  input: SubscribeInput,
  existing: PushRecord | null,
  now: Date,
): PushRecord {
  return {
    subscription: input.subscription,
    threshold: input.threshold,
    lang: input.lang,
    options: input.options,
    lastMorning: existing?.lastMorning ?? null,
    createdAt: existing?.createdAt ?? now.toISOString(),
    locations: input.locations.map((location) => {
      const previous = existing?.locations.find(
        (l) =>
          l.id === location.id ||
          (l.lat === location.lat && l.lon === location.lon),
      );
      return {
        ...location,
        lastAlertKey: previous?.lastAlertKey ?? null,
        lastAlertAt: previous?.lastAlertAt ?? null,
        lastForecast: previous?.lastForecast ?? null,
        lastSpike: previous?.lastSpike ?? null,
        lastExpected: previous?.lastExpected ?? null,
        lastSchool: previous?.lastSchool ?? null,
      };
    }),
  };
}
