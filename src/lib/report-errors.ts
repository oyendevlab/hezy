import { browserFamily, isNoise, type ErrorReport } from "./error-log";
import { APP_VERSION } from "./version";

/** Laporan maksimum bagi setiap sesi; mesej sama dihantar sekali sahaja. */
const MAX_PER_SESSION = 3;
const sent = new Set<string>();
let installed = false;

/** Hantar satu laporan ralat ke /api/log (sendBeacon jika ada). */
export function reportError(
  kind: ErrorReport["kind"],
  error: unknown,
  fallbackMessage = "Ralat tidak diketahui",
) {
  try {
    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : typeof error === "string"
          ? error
          : fallbackMessage;
    const stack = error instanceof Error ? (error.stack ?? "") : "";
    if (isNoise(message, stack, window.location.origin)) return;
    if (sent.has(message) || sent.size >= MAX_PER_SESSION) return;
    sent.add(message);
    const report: ErrorReport = {
      kind,
      message,
      stack,
      path: window.location.pathname,
      version: APP_VERSION,
      browser: browserFamily(navigator.userAgent),
    };
    const body = JSON.stringify(report);
    if (!navigator.sendBeacon?.("/api/log", body)) {
      void fetch("/api/log", { method: "POST", body, keepalive: true }).catch(
        () => undefined,
      );
    }
  } catch {
    // Pelapor ralat tidak boleh menyebabkan ralat lain.
  }
}

/** Dengar ralat global sekali bagi setiap halaman (production sahaja). */
export function installErrorReporting() {
  if (installed) return;
  installed = true;
  window.addEventListener("error", (event) => {
    reportError("error", event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    reportError("rejection", event.reason);
  });
}
