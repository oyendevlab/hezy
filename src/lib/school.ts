/**
 * Panduan status sekolah ikut garis panduan jerebu Kementerian Pendidikan (KPM).
 *
 * Sumber (disahkan 14 Okt 2026):
 * - KPM, kenyataan 7 Okt 2026: aktiviti luar bilik darjah dihentikan serta-merta jika IPU > 100.
 *   https://www.utusan.com.my/nasional/2026/10/aktiviti-luar-bilik-darjah-henti-serta-merta-jika-ipu-lebih-100/
 * - KPM, kenyataan 8 Okt 2026: institusi pendidikan di kawasan dengan IPU > 180 ditutup;
 *   IPU > 150 secara berpanjangan tiga hari berturut-turut juga ditutup.
 *   https://berita.rtm.gov.my/?p=706955
 *   https://www.malaysiakini.com/news/886611-sekolah-ditutup-jika-ipu-lebih-180-lebih-150-selama-tiga-hari
 * - Keputusan harian berdasarkan bacaan JAS setakat 2 petang (cth. JPWPKL: stesen Cheras dan Batu Muda).
 *   https://www.bernama.com/bm/news.php?id=2617374
 *
 * Ini panduan sahaja; keputusan rasmi dibuat oleh sekolah, PPD dan JPN. Ambang di sini
 * dikemas kini bila KPM mengubah peraturan.
 */

export const SCHOOL_OUTDOOR_LIMIT = 100;
/** Sekolah ditutup bila IPU melebihi ini. */
export const SCHOOL_CLOSURE_LIMIT = 180;
/** IPU berpanjangan: melebihi ini selama SCHOOL_PROLONGED_DAYS hari berturut-turut. */
export const SCHOOL_PROLONGED_LIMIT = 150;
export const SCHOOL_PROLONGED_DAYS = 3;
/** Jam bacaan yang digunakan untuk keputusan esok (waktu Malaysia). */
export const SCHOOL_DECISION_HOUR = 14;

export type SchoolLevel = "normal" | "no-outdoor" | "closed";

export type SchoolStatus = {
  level: SchoolLevel;
  title: string;
  /** Satu baris ringkasan pada kad padat. */
  summary: string;
  detail: string;
};

export function schoolStatus(ipu: number): SchoolStatus {
  if (ipu > SCHOOL_CLOSURE_LIMIT) {
    return {
      level: "closed",
      title: "Sekolah mungkin ditutup",
      summary: "IPU melebihi 180",
      detail:
        "Garis panduan KPM: institusi pendidikan di kawasan dengan IPU melebihi 180 ditutup dan melaksanakan PdPR. Semak makluman rasmi sekolah dan PPD.",
    };
  }
  if (ipu > SCHOOL_OUTDOOR_LIMIT) {
    return {
      level: "no-outdoor",
      title: "Aktiviti luar sekolah dihentikan",
      summary: "IPU melebihi 100 · Sekolah dibuka",
      detail:
        "Garis panduan KPM: semua aktiviti luar bilik darjah, termasuk perhimpunan, sukan dan kokurikulum, dihentikan bila IPU melebihi 100. Sekolah kekal dibuka.",
    };
  }
  return {
    level: "normal",
    title: "Sekolah seperti biasa",
    summary: "Aktiviti luar dibenarkan",
    detail:
      "Aktiviti luar dibenarkan. KPM menyarankan aktiviti luar ditangguhkan jika cuaca terlalu panas dan berjerebu; pantau murid yang ada asma.",
  };
}

export type SchoolTomorrow = {
  /** `likely`: syarat penutupan dipenuhi; `watch`: IPU > 150 tetapi belum tiga hari. */
  level: "likely" | "watch";
  /** IPU jam 2 petang hari ini. */
  ipu: number;
  /** Bilangan hari berturut-turut (berakhir hari ini) IPU jam 2 petang > 150. */
  streak: number;
};

/**
 * Jangkaan sekolah esok daripada bacaan jam 2 petang (lama → hari ini, hari ini terakhir).
 * `null` sebelum bacaan jam 2 petang hari ini ada, atau bila IPU ≤ 150.
 */
export function schoolTomorrow(
  twoPm: readonly (number | null)[],
): SchoolTomorrow | null {
  const today = twoPm.at(-1);
  if (today == null || today <= SCHOOL_PROLONGED_LIMIT) return null;
  let streak = 0;
  for (let i = twoPm.length - 1; i >= 0; i--) {
    const v = twoPm[i];
    if (v == null || v <= SCHOOL_PROLONGED_LIMIT) break;
    streak++;
  }
  const likely =
    today > SCHOOL_CLOSURE_LIMIT || streak >= SCHOOL_PROLONGED_DAYS;
  return { level: likely ? "likely" : "watch", ipu: today, streak };
}
