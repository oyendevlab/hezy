export type HourlyIpu = { time: string; ipu: number | null };

export type BestWindow = { start: string; end: string; averageIpu: number };

/**
 * Cari tetingkap `size` jam berturut-turut dengan purata IPU terendah,
 * bermula dari indeks `from`. Tetingkap yang mengandungi `null` diabaikan.
 */
export function findBestWindow(
  hours: readonly HourlyIpu[],
  from: number,
  size = 3,
): BestWindow | null {
  let best: BestWindow | null = null;
  for (let i = Math.max(0, from); i + size <= hours.length; i++) {
    const slice = hours.slice(i, i + size);
    if (slice.some((h) => h.ipu === null)) continue;
    const average = slice.reduce((sum, h) => sum + (h.ipu ?? 0), 0) / size;
    if (best === null || average < best.averageIpu) {
      best = {
        start: slice[0].time,
        end: slice[size - 1].time,
        averageIpu: Math.round(average),
      };
    }
  }
  return best;
}
