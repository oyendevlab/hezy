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

export type SubscribeInput = {
  subscription: PushSubscriptionData;
  threshold: AlertThreshold;
  locations: AlertLocation[];
  lang: Lang;
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
    },
  };
}
