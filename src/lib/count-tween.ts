/** Tempoh kiraan naik/turun nombor IPU. */
export const COUNT_MS = 700;

/** Nilai pertengahan (dibundarkan) pada pecahan masa `t` (0–1), dengan ease-out kubik. */
export function countAt(from: number, to: number, t: number): number {
  const p = Math.min(Math.max(t, 0), 1);
  const eased = 1 - (1 - p) ** 3;
  return Math.round(from + (to - from) * eased);
}
