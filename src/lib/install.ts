import { useSyncExternalStore } from "react";

/** Peristiwa `beforeinstallprompt` (Chromium sahaja; tiada dalam jenis DOM standard). */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallStatus = "installed" | "available" | "ios" | "manual";

export function installStatus(env: {
  standalone: boolean;
  ios: boolean;
  canPrompt: boolean;
}): InstallStatus {
  if (env.standalone) return "installed";
  if (env.canPrompt) return "available";
  if (env.ios) return "ios";
  return "manual";
}

let deferred: InstallPromptEvent | null = null;
let installed = false;
let listening = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** Mula mendengar peristiwa pemasangan. Dipanggil sekali dari layout. */
export function listenForInstall() {
  if (listening) return;
  listening = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    notify();
  });
}

function getStatus(): InstallStatus {
  const standalone =
    installed ||
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return installStatus({
    standalone,
    ios: /iphone|ipad|ipod/i.test(navigator.userAgent),
    canPrompt: deferred !== null,
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Status pemasangan; `null` semasa render pelayan. */
export function useInstallStatus(): InstallStatus | null {
  return useSyncExternalStore(subscribe, getStatus, () => null);
}

export async function promptInstall() {
  if (!deferred) return;
  const event = deferred;
  await event.prompt();
  await event.userChoice;
  deferred = null;
  notify();
}
