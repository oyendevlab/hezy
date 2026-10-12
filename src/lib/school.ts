/**
 * Panduan status sekolah ikut garis panduan jerebu Kementerian Pendidikan (KPM).
 *
 * Sumber (disahkan 12 Okt 2026):
 * - KPM, kenyataan 7 Okt 2026: aktiviti luar bilik darjah dihentikan serta-merta jika IPU > 100;
 *   sekolah dalam kawasan/daerah dengan IPU > 200 ditutup segera.
 *   https://www.utusan.com.my/nasional/2026/10/aktiviti-luar-bilik-darjah-henti-serta-merta-jika-ipu-lebih-100/
 * - Sekolah boleh ditutup tanpa menunggu kelulusan PPD bila IPU > 200 (Sinar Harian, 9 Okt 2023).
 *   https://www.sinarharian.com.my/article/283294/edisi/selangor-kl/boleh-tutup-sekolah-tanpa-kelulusan-ppd-jika-ipu-lebih-200
 *
 * Ini panduan sahaja; keputusan rasmi dibuat oleh sekolah, PPD dan JPN.
 */

export const SCHOOL_OUTDOOR_LIMIT = 100;
export const SCHOOL_CLOSURE_LIMIT = 200;

export type SchoolLevel = "normal" | "no-outdoor" | "closed";

export type SchoolStatus = {
  level: SchoolLevel;
  title: string;
  detail: string;
};

export function schoolStatus(ipu: number): SchoolStatus {
  if (ipu > SCHOOL_CLOSURE_LIMIT) {
    return {
      level: "closed",
      title: "Sekolah mungkin ditutup",
      detail:
        "Garis panduan KPM: sekolah di kawasan atau daerah dengan IPU melebihi 200 ditutup segera. Semak makluman rasmi sekolah dan PPD tentang PdPR.",
    };
  }
  if (ipu > SCHOOL_OUTDOOR_LIMIT) {
    return {
      level: "no-outdoor",
      title: "Aktiviti luar dihentikan",
      detail:
        "Garis panduan KPM: semua aktiviti luar bilik darjah, termasuk perhimpunan, sukan dan kokurikulum, dihentikan bila IPU melebihi 100. Sekolah kekal dibuka.",
    };
  }
  return {
    level: "normal",
    title: "Sekolah seperti biasa",
    detail:
      "Aktiviti luar dibenarkan. KPM menyarankan aktiviti luar ditangguhkan jika cuaca terlalu panas dan berjerebu; pantau murid yang ada asma.",
  };
}
