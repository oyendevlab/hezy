/**
 * Panduan status sekolah semasa jerebu (v0.7.3: "jalan tengah").
 *
 * Peraturan penutupan KPM/JPN sering berubah (ambang 200, kemudian 180 dan 150 × 3 hari pada
 * Okt 2026), jadi Hezy tidak meramal penutupan dan tidak memaparkan ambang. Yang dipaparkan:
 * - Aktiviti luar dihentikan bila IPU > 100 (garis panduan KPM yang stabil).
 *   https://www.utusan.com.my/nasional/2026/10/aktiviti-luar-bilik-darjah-henti-serta-merta-jika-ipu-lebih-100/
 * - Bila IPU sangat tinggi (> 200): sekolah mungkin ditutup — semak pengumuman.
 * - Bila bacaan jam 2 petang (asas keputusan harian JPN) kekal tinggi beberapa hari:
 *   isyarat neutral untuk memantau pengumuman sekolah.
 * Keputusan rasmi sentiasa oleh sekolah, PPD dan JPN.
 */

export const SCHOOL_OUTDOOR_LIMIT = 100;
/** IPU melebihi ini: sekolah mungkin ditutup (tanpa menyebut ambang kepada pengguna). */
export const SCHOOL_CLOSURE_LIMIT = 200;
/** "Bacaan tinggi berterusan": IPU jam 2 petang melebihi ini selama SCHOOL_PROLONGED_DAYS hari. */
export const SCHOOL_PROLONGED_LIMIT = 150;
export const SCHOOL_PROLONGED_DAYS = 2;
/** Jam bacaan yang digunakan untuk keputusan harian (waktu Malaysia). */
export const SCHOOL_DECISION_HOUR = 14;

export type SchoolLevel = "normal" | "no-outdoor" | "closed";

export type SchoolStatus = { level: SchoolLevel; title: string };

export function schoolStatus(ipu: number): SchoolStatus {
  if (ipu > SCHOOL_CLOSURE_LIMIT)
    return { level: "closed", title: "Sekolah mungkin ditutup" };
  if (ipu > SCHOOL_OUTDOOR_LIMIT)
    return { level: "no-outdoor", title: "Aktiviti luar dihentikan" };
  return { level: "normal", title: "Aktiviti luar dibenarkan" };
}

/**
 * Bacaan tinggi berterusan: IPU jam 2 petang (lama → hari ini) melebihi
 * SCHOOL_PROLONGED_LIMIT bagi setiap SCHOOL_PROLONGED_DAYS hari terakhir, termasuk hari ini.
 * Memulangkan IPU jam 2 petang hari ini, atau `null`.
 */
export function schoolPersistentHigh(
  twoPm: readonly (number | null)[],
): number | null {
  const recent = twoPm.slice(-SCHOOL_PROLONGED_DAYS);
  if (recent.length < SCHOOL_PROLONGED_DAYS) return null;
  return recent.every((v) => v != null && v > SCHOOL_PROLONGED_LIMIT)
    ? recent.at(-1)!
    : null;
}
