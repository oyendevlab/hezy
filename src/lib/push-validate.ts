import { isInMalaysia } from "./coords";

/** Had IPU untuk amaran (PRD F13). */
export const ALERT_THRESHOLD = 100;

export type PushSubscriptionData = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type SubscribeInput = {
  subscription: PushSubscriptionData;
  lat: number;
  lon: number;
  locationName: string;
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
    },
  };
}
