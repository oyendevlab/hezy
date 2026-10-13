import { distanceKm, type Station } from "./apims";
import { STATES, findArea, findStateByApimsId } from "./areas";
import { OFFICIAL_MAX_KM } from "./official";

/**
 * Lokasi dianggap di sempadan bila stesen negeri lain hampir sama dekat: kurang daripada
 * nisbah ini × jarak stesen terdekat (atau dalam AMBIGUOUS_MARGIN_KM daripadanya).
 */
export const AMBIGUOUS_RATIO = 1.5;
export const AMBIGUOUS_MARGIN_KM = 5;

export const isStateId = (id: unknown): id is string =>
  typeof id === "string" && STATES.some((s) => s.id === id);

export const flagPath = (stateId: string) => `/flags/${stateId}.png`;

/**
 * Negeri bagi koordinat (untuk bendera kad kongsi lokasi GPS): negeri stesen APIMS terdekat
 * dalam OFFICIAL_MAX_KM. `null` bila tiada stesen dekat atau lokasi di sempadan (stesen
 * negeri lain hampir sama dekat) — lebih baik tiada bendera daripada bendera yang salah.
 */
export function stateForPoint(
  stations: readonly Station[],
  point: { lat: number; lon: number },
  maxKm = OFFICIAL_MAX_KM,
): string | null {
  const ranked = stations
    .map((s) => ({
      state: findStateByApimsId(s.stateId),
      d: distanceKm(point, s),
    }))
    .filter((x) => x.state !== undefined)
    .sort((a, b) => a.d - b.d);
  const nearest = ranked[0];
  if (!nearest || nearest.d > maxKm) return null;
  const other = ranked.find((x) => x.state!.id !== nearest.state!.id);
  if (
    other &&
    other.d <
      Math.max(nearest.d * AMBIGUOUS_RATIO, nearest.d + AMBIGUOUS_MARGIN_KM)
  )
    return null;
  return nearest.state!.id;
}

/**
 * Negeri bagi lokasi tersimpan: kawasan daripada senarai bandar sentiasa diketahui;
 * selainnya (GPS, stesen) ikut `readingState` yang dikira pelayan.
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
