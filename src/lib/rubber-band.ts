/**
 * Fizik kad elastik (tarik untuk muat semula di Utama): rintangan seperti getah dengan had.
 * `distance` ialah jarak jari bergerak (px); hasil ialah anjakan kad (px), < `max`.
 */
export const PULL_MAX = 140;
export const PULL_THRESHOLD = 64;
/** Kekakuan: semakin besar, semakin mudah kad ditarik. */
const STIFFNESS = 160;

export function rubberBand(distance: number, max = PULL_MAX): number {
  if (distance <= 0) return 0;
  return max * (1 - Math.exp(-distance / STIFFNESS));
}
