import type { SavedLocation } from "./prefs";
import type { AlertThreshold } from "./push-validate";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
/** Tandatangan tetapan terakhir yang dihantar ke pelayan (lokasi + ambang). */
const SYNC_KEY = "hezy:push:sync";

const signature = (locations: SavedLocation[], threshold: AlertThreshold) =>
  `${threshold}|${locations.map((l) => `${l.id}@${l.lat},${l.lon}`).join(";")}`;

export type PushSupport =
  "supported" | "unsupported" | "ios-install" | "unconfigured";

export function pushSupport(): PushSupport {
  if (!VAPID_PUBLIC_KEY) return "unconfigured";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (ios && !standalone) return "ios-install";
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }
  return "supported";
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

async function sendSubscription(
  subscription: PushSubscription,
  locations: SavedLocation[],
  threshold: AlertThreshold,
) {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      threshold,
      locations: locations.map(({ id, name, lat, lon }) => ({
        id,
        name,
        lat,
        lon,
      })),
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Langganan tidak dapat disimpan.");
  }
  try {
    localStorage.setItem(SYNC_KEY, signature(locations, threshold));
  } catch {
    // Abaikan.
  }
}

/** Minta kebenaran, langgan push dan daftar lokasi untuk amaran. */
export async function enablePush(
  locations: SavedLocation[],
  threshold: AlertThreshold,
): Promise<"enabled" | "denied"> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));
  await sendSubscription(subscription, locations, threshold);
  return "enabled";
}

export async function disablePush() {
  const subscription = await currentSubscription();
  if (!subscription) return;
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => undefined);
  await subscription.unsubscribe();
  try {
    localStorage.removeItem(SYNC_KEY);
  } catch {
    // Abaikan.
  }
}

/** Kemas kini lokasi dan ambang amaran di pelayan bila berubah (jika sudah melanggan). */
export async function syncPushSettings(
  locations: SavedLocation[],
  threshold: AlertThreshold,
) {
  if (locations.length === 0) return;
  if (pushSupport() !== "supported" || Notification.permission !== "granted")
    return;
  try {
    if (localStorage.getItem(SYNC_KEY) === signature(locations, threshold))
      return;
  } catch {
    return;
  }
  const subscription = await currentSubscription();
  if (subscription)
    await sendSubscription(subscription, locations, threshold).catch(
      () => undefined,
    );
}
