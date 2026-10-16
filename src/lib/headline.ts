import type { HealthProfile } from "./advice";
import type { IpuCategoryKey } from "./ipu";
import { displayIpu } from "./official";

/**
 * Ayat nasihat di bawah nombor IPU, dipilih ikut keadaan supaya tidak terlalu generik
 * (v0.7.1). Keutamaan: profil → arah IPU → hujan → waktu. Setiap keadaan ada 1–2 variasi,
 * dipilih secara stabil ikut hari dan lokasi (tidak bertukar setiap kali dimuat semula).
 */

export type HeadlineSituation =
  | Exclude<HealthProfile, "umum">
  | "naik"
  | "turun"
  | "hujan"
  | "pagi"
  | "petang"
  | "malam";

type Table = Partial<Record<HeadlineSituation, readonly string[]>>;

export const HEADLINES: Record<IpuCategoryKey, Table> = {
  baik: {
    naik: ["Udara masih bersih, tetapi IPU sedang naik."],
    turun: ["Udara kembali bersih. Aktiviti luar seperti biasa."],
    hujan: ["Udara bersih. Bawa payung jika keluar."],
    pagi: [
      "Udara bersih pagi ini. Sesuai untuk aktiviti luar.",
      "Pagi yang baik untuk keluar rumah.",
    ],
    petang: [
      "Udara bersih. Aktiviti luar seperti biasa.",
      "Udara bersih petang ini. Nikmati masa di luar.",
    ],
    malam: [
      "Udara bersih malam ini. Buka tingkap untuk udara segar.",
      "Udara bersih. Sesuai untuk berjalan malam.",
    ],
  },
  sederhana: {
    anak: ["Anak boleh bermain di luar. Pantau jika batuk."],
    asma: ["Aktiviti luar boleh. Bawa inhaler bersama."],
    emas: ["Jalan santai boleh diteruskan. Berehat jika penat."],
    naik: ["IPU sedang naik. Pantau bacaan jika merancang aktiviti luar."],
    turun: ["Udara semakin baik. Aktiviti luar seperti biasa."],
    hujan: ["Hujan membantu membersihkan udara. Aktiviti luar seperti biasa."],
    pagi: [
      "Udara sederhana pagi ini. Aktiviti luar masih boleh.",
      "Aktiviti luar seperti biasa. Kumpulan sensitif perlu berwaspada.",
    ],
    petang: [
      "Aktiviti luar boleh diteruskan. Berehat jika rasa tidak selesa.",
      "Aktiviti luar seperti biasa. Kumpulan sensitif perlu berwaspada.",
    ],
    malam: ["Udara sederhana malam ini. Tiada sekatan aktiviti."],
  },
  "tidak-sihat": {
    anak: ["Anak elok bermain di dalam rumah hari ini."],
    asma: ["Hadkan aktiviti luar dan bawa inhaler."],
    emas: ["Tangguhkan berjalan di luar hari ini."],
    naik: ["Jerebu semakin teruk. Hadkan masa di luar."],
    turun: ["Udara beransur pulih, tetapi hadkan aktiviti luar dahulu."],
    hujan: ["Hujan membantu, tetapi udara masih tidak sihat."],
    pagi: [
      "Tangguhkan aktiviti luar pagi ini.",
      "Elak aktiviti luar yang berat pagi ini.",
    ],
    petang: [
      "Kurangkan aktiviti luar petang ini.",
      "Pilih aktiviti dalam bangunan petang ini.",
    ],
    malam: [
      "Tutup tingkap sebelum tidur malam ini.",
      "Kekal di dalam dan tutup tingkap malam ini.",
    ],
  },
  "sangat-tidak-sihat": {
    anak: ["Anak perlu kekal di dalam rumah."],
    asma: ["Kekal di dalam. Jumpa doktor jika simptom bertambah."],
    emas: ["Kekal di dalam dan jumpa doktor jika tidak sihat."],
    naik: ["Jerebu semakin teruk. Kekal di dalam."],
    turun: ["Udara beransur pulih, tetapi masih sangat tidak sihat."],
    hujan: ["Hujan belum cukup. Udara masih sangat tidak sihat."],
    pagi: ["Kekal di dalam pagi ini. Elak semua aktiviti luar."],
    petang: ["Kekal di dalam dan kurangkan aktiviti fizikal."],
    malam: ["Tutup tingkap dan pintu. Guna penapis udara jika ada."],
  },
  berbahaya: {
    anak: ["Anak tidak boleh keluar rumah."],
    asma: ["Dapatkan rawatan segera jika sesak nafas."],
    emas: ["Kekal di dalam dan dapatkan rawatan jika sesak nafas."],
    turun: ["IPU menurun, tetapi masih berbahaya. Jangan keluar."],
    pagi: [
      "Jangan keluar. Ikut arahan pihak berkuasa.",
      "Kekal di dalam. Ikut pengumuman rasmi.",
    ],
    petang: [
      "Jangan keluar. Ikut arahan pihak berkuasa.",
      "Kekal di dalam. Ikut pengumuman rasmi.",
    ],
    malam: ["Jangan keluar. Ikut arahan pihak berkuasa."],
  },
};

/** Perubahan IPU (3 jam) yang dikira "naik" atau "turun". */
export const TREND_STEP = 10;

export const timeOfDay = (hour: number): "pagi" | "petang" | "malam" =>
  hour >= 5 && hour < 11
    ? "pagi"
    : hour >= 11 && hour < 19
      ? "petang"
      : "malam";

/** Cincangan ringkas (FNV-1a) untuk pilihan variasi yang stabil. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickHeadline(ctx: {
  category: IpuCategoryKey;
  profile?: HealthProfile;
  /** Perubahan IPU dalam 3 jam (positif = naik); `null` bila tidak diketahui. */
  change?: number | null;
  raining?: boolean;
  /** Jam tempatan 0–23. */
  hour: number;
  /** Kunci kestabilan, cth. `${tarikh}:${idLokasi}`. */
  seed: string;
}): string {
  const table = HEADLINES[ctx.category];
  const order: HeadlineSituation[] = [];
  if (ctx.profile && ctx.profile !== "umum") order.push(ctx.profile);
  if (ctx.change != null && ctx.change >= TREND_STEP) order.push("naik");
  if (ctx.change != null && ctx.change <= -TREND_STEP) order.push("turun");
  if (ctx.raining) order.push("hujan");
  order.push(timeOfDay(ctx.hour));
  for (const situation of order) {
    const options = table[situation];
    if (options?.length)
      return options[
        hash(`${ctx.seed}:${ctx.category}:${situation}`) % options.length
      ];
  }
  return table.petang?.[0] ?? "";
}

/**
 * Perubahan IPU 3 jam terakhir daripada jam yang sudah berlalu (rasmi APIMS jika ada; nilai sama
 * seperti graf, v0.8.7).
 * `null` bila data tidak cukup.
 */
export function recentChange(
  today: readonly (Parameters<typeof displayIpu>[0] & { time: string })[],
): number | null {
  const value = displayIpu;
  const past = today.filter((h) => !h.forecast && value(h) !== null);
  const last = past.at(-1);
  if (!last) return null;
  const target = Date.parse(`${last.time}:00Z`) - 3 * 3_600_000;
  const before = past.find((h) => Date.parse(`${h.time}:00Z`) === target);
  return before ? value(last)! - value(before)! : null;
}
