import { IPU_CATEGORIES, type IpuCategoryKey } from "./ipu";

/** Nasihat ringkas setiap tahap untuk helaian skala IPU. */
export const LEVEL_ADVICE: Record<IpuCategoryKey, string> = {
  baik: "Udara bersih",
  sederhana: "Kumpulan sensitif perlu berwaspada",
  "tidak-sihat": "Kurangkan aktiviti luar",
  "sangat-tidak-sihat": "Elak aktiviti luar",
  berbahaya: "Kekal di dalam rumah",
};

/** Had atas paparan bar skala (tahap Berbahaya tiada had; bar berhenti di sini). */
const SCALE_TOP = 500;

/** Julat IPU setiap tahap untuk paparan (0–50, 51–100, …, > 300). */
export function levelRange(index: number): string {
  const c = IPU_CATEGORIES[index];
  const min = index === 0 ? 0 : (IPU_CATEGORIES[index - 1].max ?? 0) + 1;
  return c.max === null ? `> ${min - 1}` : `${min}–${c.max}`;
}

/**
 * Kedudukan (0–1) nombor IPU pada bar skala: lima tahap sama lebar, kedudukan dalam
 * setiap tahap berkadar dengan julatnya.
 */
export function scalePosition(ipu: number): number {
  const n = IPU_CATEGORIES.length;
  let low = 0;
  for (let i = 0; i < n; i++) {
    const high = IPU_CATEGORIES[i].max ?? SCALE_TOP;
    if (ipu <= high || i === n - 1) {
      const frac = Math.min(Math.max((ipu - low) / (high - low), 0), 1);
      return (i + frac) / n;
    }
    low = high;
  }
  return 1;
}
