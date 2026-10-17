import { STATES, findArea } from "./areas";

export const isStateId = (id: unknown): id is string =>
  typeof id === "string" && STATES.some((s) => s.id === id);

export const flagPath = (stateId: string) => `/flags/${stateId}.png`;

/**
 * Negeri bagi lokasi tersimpan: kawasan daripada senarai bandar sentiasa diketahui;
 * selainnya (GPS, stesen) ikut `readingState` yang dikira pelayan daripada sempadan negeri
 * (`places.ts`, v0.8.11).
 */
export function locationStateId(
  location: { id: string },
  readingState: string | null | undefined,
): string | null {
  if (location.id.startsWith("area:")) {
    const area = findArea(location.id.slice(5));
    const state = area && STATES.find((s) => s.name === area.state);
    if (state) return state.id;
  }
  return isStateId(readingState) ? readingState : null;
}
