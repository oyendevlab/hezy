import type { HealthProfile } from "./advice";
import { isInMalaysia } from "./coords";

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

export type SubscribeInput = {
  subscription: PushSubscriptionData;
  lat: number;
  lon: number;
  locationName: string;
  threshold: AlertThreshold;
};

const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

/** Sahkan badan POST /api/push/subscribe. */
export function parseSubscribeBody(
  body: unknown,
): { ok: true; value: SubscribeInput } | { ok: false; error: string } {
  const b = body as Partial<SubscribeInput> | null;
  const sub = b?.subscription as Partial<PushSubscriptionData> | undefined;
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
  const lat = Number(b?.lat);
  const lon = Number(b?.lon);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !isInMalaysia({ lat, lon })
  ) {
    return { ok: false, error: "Lokasi mesti berada dalam Malaysia." };
  }
  const locationName =
    typeof b?.locationName === "string"
      ? b.locationName.trim().slice(0, 80)
      : "";
  return {
    ok: true,
    value: {
      subscription: { endpoint, keys: { p256dh, auth } },
      lat: Math.round(lat * 100) / 100,
      lon: Math.round(lon * 100) / 100,
      locationName: locationName || "Lokasi anda",
      threshold: isAlertThreshold(Number(b?.threshold))
        ? (Number(b?.threshold) as AlertThreshold)
        : DEFAULT_ALERT_THRESHOLD,
    },
  };
}
