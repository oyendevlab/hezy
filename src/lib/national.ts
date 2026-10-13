import type { Station } from "./apims";
import { findStateByApimsId } from "./areas";

export type StateReading = { id: string; name: string; ipu: number };

/** Ringkasan "Malaysia sekarang": negeri dengan IPU maksimum tertinggi dan terendah. */
export type NationalSummary = {
  highest: StateReading;
  lowest: StateReading;
  /** Bacaan stesen terkini, waktu Malaysia `YYYY-MM-DDTHH:mm`. */
  time: string | null;
};

export function nationalSummary(stations: Station[]): NationalSummary | null {
  const byState = new Map<string, StateReading>();
  let time: string | null = null;
  for (const s of stations) {
    if (s.ipu === null) continue;
    const state = findStateByApimsId(s.stateId);
    if (!state) continue;
    const prev = byState.get(state.id);
    if (!prev || s.ipu > prev.ipu)
      byState.set(state.id, { id: state.id, name: state.name, ipu: s.ipu });
    if (s.time && (!time || s.time > time)) time = s.time;
  }
  const list = [...byState.values()];
  if (list.length < 2) return null;
  const sorted = list.sort(
    (a, b) => b.ipu - a.ipu || a.name.localeCompare(b.name),
  );
  return { highest: sorted[0], lowest: sorted[sorted.length - 1], time };
}
