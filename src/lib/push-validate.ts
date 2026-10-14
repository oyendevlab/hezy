import type { HealthProfile } from "./advice";
import { isInMalaysia } from "./coords";
import { isLang, type Lang } from "./i18n";

/** Ambang IPU untuk amaran yang boleh dipilih. */
export const ALERT_THRESHOLDS = [50, 100, 200] as const;
export type AlertThreshold = (typeof ALERT_THRESHOLDS)[number];

/** Ambang lalai: rekod lama (sebelum v0.3.0) dan profil Umum. */
export const DEFAULT_ALERT_THRESHOLD: AlertThreshold = 100;

/** Profil berisiko diberi amaran lebih awal. */
export function defaultThreshold(profile: HealthProfile): AlertThreshold {
  return profile === "umum" ? 100 : 50;
}

export function isAlertThreshold(value: unknown): value is AlertThreshold {
  return ALERT_THRESHOLDS.includes(value as AlertThreshold);
}

export type PushSubscriptionData = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Lokasi semasa + sehingga 5 kegemaran. */
export const MAX_ALERT_LOCATIONS = 6;

export type AlertLocation = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

/** Pilihan rutin amaran (v0.4.0). Jam dalam waktu Malaysia (0–23). */
export type PushOptions = {
  /** Ringkasan pagi jam 7 (item 5). */
  morning: boolean;
  /** Amaran ramalan esok jam 8 malam (item 6/7). */
  forecast: boolean;
  /** Amaran lonjakan: IPU naik mendadak walaupun di bawah ambang (v0.7.0 item 9). */
  spike: boolean;
  /** Amaran jerebu dijangka: ramalan 6 jam melepasi ambang (v0.7.0 item 10). */
  expected: boolean;
  /** Notifikasi bacaan jam 2 petang kekal tinggi (semak pengumuman sekolah); ikut paparan status sekolah. */
  school: boolean;
  /** Waktu senyap; `null` = tiada. Amaran ditangguh kecuali IPU > 300. */
  quiet: { start: number; end: number } | null;
};

/** Rekod lama tanpa pilihan: tiada ringkasan, tiada amaran ramalan, tiada waktu senyap. */
export const LEGACY_OPTIONS: PushOptions = {
  morning: false,
  forecast: false,
  spike: false,
  expected: false,
  school: false,
  quiet: null,
};

const isHour = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 23;

export function parseOptions(raw: unknown): PushOptions {
  const r = raw as {
    morning?: unknown;
    forecast?: unknown;
    spike?: unknown;
    expected?: unknown;
    school?: unknown;
    quiet?: { start?: unknown; end?: unknown } | null;
  } | null;
  const quiet =
    r?.quiet &&
    isHour(r.quiet.start) &&
    isHour(r.quiet.end) &&
    r.quiet.start !== r.quiet.end
      ? { start: r.quiet.start, end: r.quiet.end }
      : null;
  return {
    morning: r?.morning === true,
    forecast: r?.forecast === true,
    spike: r?.spike === true,
    expected: r?.expected === true,
    school: r?.school === true,
    quiet,
  };
}

export type SubscribeInput = {
  subscription: PushSubscriptionData;
  threshold: AlertThreshold;
  locations: AlertLocation[];
  lang: Lang;
  options: PushOptions;
};

const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

function parseLocation(raw: unknown, fallbackId: string): AlertLocation | null {
  const r = raw as {
    id?: unknown;
    name?: unknown;
    lat?: unknown;
    lon?: unknown;
    locationName?: unknown;
  } | null;
  const lat = Number(r?.lat);
  const lon = Number(r?.lon);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !isInMalaysia({ lat, lon })
  )
    return null;
  const rawName =
    typeof r?.name === "string"
      ? r.name
      : typeof r?.locationName === "string"
        ? r.locationName
        : "";
  const id = typeof r?.id === "string" && r.id.length <= 80 ? r.id : fallbackId;
  return {
    id,
    name: rawName.trim().slice(0, 80) || "Lokasi anda",
    lat: Math.round(lat * 100) / 100,
    lon: Math.round(lon * 100) / 100,
  };
}

/**
 * Sahkan badan POST /api/push/subscribe.
 * Format baharu: `{ subscription, threshold, locations: [{ id, name, lat, lon }] }`.
 * Format lama (sebelum v0.3.0): `{ subscription, lat, lon, locationName }` → satu lokasi.
 */
export function parseSubscribeBody(
  body: unknown,
): { ok: true; value: SubscribeInput } | { ok: false; error: string } {
  const b = body as {
    subscription?: Partial<PushSubscriptionData>;
    locations?: unknown;
    threshold?: unknown;
    lang?: unknown;
    options?: unknown;
  } | null;
  const sub = b?.subscription;
  const endpoint = sub?.endpoint;
  if (
    typeof endpoint !== "string" ||
    !/^https:\/\/[^\s]+$/.test(endpoint) ||
    endpoint.length > 1000
  ) {
    return { ok: false, error: "Langganan notifikasi tidak sah." };
  }
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (
    typeof p256dh !== "string" ||
    typeof auth !== "string" ||
    !BASE64URL.test(p256dh) ||
    !BASE64URL.test(auth)
  ) {
    return { ok: false, error: "Kunci langganan tidak sah." };
  }

  const rawLocations = Array.isArray(b?.locations) ? b.locations : [b];
  if (rawLocations.length === 0 || rawLocations.length > MAX_ALERT_LOCATIONS) {
    return {
      ok: false,
      error: `Pilih 1 hingga ${MAX_ALERT_LOCATIONS} lokasi untuk amaran.`,
    };
  }
  const locations: AlertLocation[] = [];
  for (const [i, raw] of rawLocations.entries()) {
    const location = parseLocation(raw, i === 0 ? "semasa" : `lokasi-${i}`);
    if (!location)
      return { ok: false, error: "Lokasi mesti berada dalam Malaysia." };
    if (!locations.some((l) => l.id === location.id)) locations.push(location);
  }

  const threshold = Number(b?.threshold);
  return {
    ok: true,
    value: {
      subscription: { endpoint, keys: { p256dh, auth } },
      threshold: isAlertThreshold(threshold)
        ? threshold
        : DEFAULT_ALERT_THRESHOLD,
      locations,
      lang: isLang(b?.lang) ? b.lang : "ms",
      options: b?.options ? parseOptions(b.options) : LEGACY_OPTIONS,
    },
  };
}
