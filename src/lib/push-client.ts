import type { SavedLocation } from "./prefs";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
/** Lokasi terakhir yang dihantar ke pelayan untuk amaran (id lokasi). */
const LOCATION_KEY = "hezy:push:location";

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
  location: SavedLocation,
) {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      lat: location.lat,
      lon: location.lon,
      locationName: location.name,
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Langganan tidak dapat disimpan.");
  }
  try {
    localStorage.setItem(LOCATION_KEY, location.id);
  } catch {
    // Abaikan.
  }
}

/** Minta kebenaran, langgan push dan daftar lokasi untuk amaran. */
export async function enablePush(
  location: SavedLocation,
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
  await sendSubscription(subscription, location);
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
    localStorage.removeItem(LOCATION_KEY);
  } catch {
    // Abaikan.
  }
}

/** Kemas kini lokasi amaran bila lokasi semasa berubah (jika sudah melanggan). */
export async function syncPushLocation(location: SavedLocation) {
  if (pushSupport() !== "supported" || Notification.permission !== "granted")
    return;
  try {
    if (localStorage.getItem(LOCATION_KEY) === location.id) return;
  } catch {
    return;
  }
  const subscription = await currentSubscription();
  if (subscription)
    await sendSubscription(subscription, location).catch(() => undefined);
}
