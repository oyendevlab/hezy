import { adviceFor } from "./advice";
import type { IpuCategoryKey } from "./ipu";
import { DEFAULT_ALERT_THRESHOLD } from "./push-validate";

/** Ulang amaran untuk kategori yang sama selepas tempoh ini. */
export const REPEAT_AFTER_HOURS = 12;

export type AlertState = {
  lastAlertKey: IpuCategoryKey | null;
  lastAlertAt: string | null;
};

export type AlertDecision =
  | { send: false; next: AlertState }
  | { send: true; next: AlertState; title: string; body: string };

/**
 * Tentukan sama ada notifikasi perlu dihantar.
 * - IPU > ambang: hantar bila kategori berubah atau sudah 12 jam sejak amaran terakhir.
 * - IPU kembali ≤ ambang selepas amaran: hantar sekali "udara kembali pulih".
 */
export function decideAlert(
  state: AlertState,
  reading: { ipu: number; category: IpuCategoryKey; label: string },
  locationName: string,
  now: Date,
  threshold: number = DEFAULT_ALERT_THRESHOLD,
): AlertDecision {
  if (reading.ipu > threshold) {
    const hoursSince = state.lastAlertAt
      ? (now.getTime() - Date.parse(state.lastAlertAt)) / 3_600_000
      : Infinity;
    if (
      state.lastAlertKey === reading.category &&
      hoursSince < REPEAT_AFTER_HOURS
    ) {
      return { send: false, next: state };
    }
    return {
      send: true,
      next: { lastAlertKey: reading.category, lastAlertAt: now.toISOString() },
      title: `Jerebu: IPU ${reading.ipu} (${reading.label})`,
      body: `${locationName}: ${adviceFor(reading.category).headline}`,
    };
  }
  if (state.lastAlertKey !== null) {
    return {
      send: true,
      next: { lastAlertKey: null, lastAlertAt: now.toISOString() },
      title: `Udara kembali pulih: IPU ${reading.ipu}`,
      body: `${locationName}: ${reading.label}. ${adviceFor(reading.category).headline}`,
    };
  }
  return { send: false, next: state };
}
