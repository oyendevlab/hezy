import type { IpuCategoryKey } from "./ipu";

/**
 * Nasihat kesihatan berdasarkan jadual "Kesan kepada Kesihatan" JAS,
 * diringkaskan untuk paparan telefon.
 */

export type HealthProfile = "umum" | "anak" | "asma" | "emas";

export const HEALTH_PROFILES: readonly { key: HealthProfile; label: string }[] =
  [
    { key: "umum", label: "Umum" },
    { key: "anak", label: "Kanak-kanak" },
    { key: "asma", label: "Asma / paru-paru" },
    { key: "emas", label: "Warga emas" },
  ];

export type QuickTone = "ya" | "berhati" | "tidak";
export type QuickAnswer = { question: string; answer: string; tone: QuickTone };

type CategoryAdvice = {
  /** Satu ayat ringkas di bawah nombor IPU. */
  headline: string;
  tips: string[];
  /** Nasihat tambahan bagi profil berisiko. */
  extra: Partial<Record<HealthProfile, string>>;
  quick: QuickAnswer[];
};

const ADVICE: Record<IpuCategoryKey, CategoryAdvice> = {
  baik: {
    headline: "Udara bersih. Aktiviti luar seperti biasa.",
    tips: ["Sesuai untuk bersenam di luar", "Buka tingkap untuk pengudaraan"],
    extra: {},
    quick: [
      { question: "Anak main di luar?", answer: "Boleh", tone: "ya" },
      { question: "Bersenam di luar?", answer: "Boleh", tone: "ya" },
      { question: "Buka tingkap?", answer: "Boleh", tone: "ya" },
    ],
  },
  sederhana: {
    headline:
      "Aktiviti luar seperti biasa. Kumpulan sensitif perlu berwaspada.",
    tips: ["Tiada sekatan aktiviti luar", "Kekalkan gaya hidup sihat"],
    extra: {
      asma: "Bawa inhaler bila keluar",
      anak: "Pantau anak jika batuk atau sesak nafas",
    },
    quick: [
      { question: "Anak main di luar?", answer: "Boleh", tone: "ya" },
      { question: "Bersenam di luar?", answer: "Boleh", tone: "ya" },
      { question: "Buka tingkap?", answer: "Boleh", tone: "ya" },
    ],
  },
  "tidak-sihat": {
    headline: "Elak bersenam di luar hari ini.",
    tips: [
      "Pakai topeng N95 jika perlu keluar",
      "Tutup tingkap dan pintu",
      "Minum air secukupnya",
    ],
    extra: {
      anak: "Hadkan aktiviti luar dan sukan di sekolah",
      asma: "Hadkan aktiviti luar dan sentiasa bawa inhaler",
      emas: "Tangguhkan jalan pagi dan aktiviti di luar",
    },
    quick: [
      { question: "Anak main di luar?", answer: "Tidak", tone: "tidak" },
      { question: "Bersenam di luar?", answer: "Dalam rumah", tone: "berhati" },
      { question: "Buka tingkap?", answer: "Tutup", tone: "tidak" },
    ],
  },
  "sangat-tidak-sihat": {
    headline: "Kekal di dalam dan kurangkan aktiviti fizikal.",
    tips: [
      "Pakai topeng N95 jika perlu keluar",
      "Tutup tingkap, guna penapis udara jika ada",
      "Elak aktiviti luar",
    ],
    extra: {
      anak: "Anak perlu kekal di dalam rumah",
      asma: "Jumpa doktor jika simptom bertambah teruk",
      emas: "Kekal di dalam dan jumpa doktor jika tidak sihat",
    },
    quick: [
      { question: "Anak main di luar?", answer: "Tidak", tone: "tidak" },
      { question: "Bersenam di luar?", answer: "Tidak", tone: "tidak" },
      { question: "Buka tingkap?", answer: "Tutup", tone: "tidak" },
    ],
  },
  berbahaya: {
    headline: "Jangan keluar. Ikut arahan pihak berkuasa.",
    tips: [
      "Elak semua aktiviti luar",
      "Tutup tingkap dan pintu",
      "Ikuti pengumuman rasmi di media",
    ],
    extra: {
      anak: "Anak tidak boleh beraktiviti di luar",
      asma: "Dapatkan rawatan segera jika sesak nafas",
      emas: "Dilarang beraktiviti di luar",
    },
    quick: [
      { question: "Anak main di luar?", answer: "Tidak", tone: "tidak" },
      { question: "Bersenam di luar?", answer: "Tidak", tone: "tidak" },
      { question: "Buka tingkap?", answer: "Tutup", tone: "tidak" },
    ],
  },
};

export type Advice = { headline: string; tips: string[]; quick: QuickAnswer[] };

export function adviceFor(
  category: IpuCategoryKey,
  profile: HealthProfile = "umum",
): Advice {
  const { headline, tips, extra, quick } = ADVICE[category];
  const profileTip = extra[profile];
  return { headline, tips: profileTip ? [profileTip, ...tips] : tips, quick };
}
