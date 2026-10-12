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

/** Tarikan baru melepasi ambang (naik sahaja) — masa untuk getaran ringan. */
export function crossedThreshold(
  previous: number,
  next: number,
  threshold = PULL_THRESHOLD,
): boolean {
  return previous < threshold && next >= threshold;
}

/** Getaran ringan (Android); diabaikan jika tiada sokongan (iOS Safari) atau pengguna belum berinteraksi. */
export function hapticTick() {
  try {
    navigator.vibrate?.(10);
  } catch {
    // Sesetengah pelayar menolak getaran tanpa interaksi pengguna.
  }
}
