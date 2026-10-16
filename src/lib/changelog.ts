/**
 * "Apa yang baharu" di Tetapan (v0.7.9): ringkasan mesra pengguna bagi setiap keluaran,
 * terbaharu dahulu. Kemas kini setiap kali versi dinaikkan (diuji: entri pertama = APP_VERSION).
 * Teks dalam BM (kunci terjemahan `t()`).
 */
export type Release = {
  version: string;
  /** Tarikh keluaran `YYYY-MM-DD`. */
  date: string;
  title: string;
  items: readonly string[];
};

export const CHANGELOG: readonly Release[] = [
  {
    version: "0.7.9",
    date: "2026-10-16",
    title: "Tentang Hezy",
    items: [
      "Kongsi Hezy dan hantar maklum balas",
      "Kad pembangun dan senarai Apa yang baharu",
    ],
  },
  {
    version: "0.7.8",
    date: "2026-10-16",
    title: "Tetapan lebih kemas",
    items: [
      "Notifikasi dan amaran diasingkan",
      "Nombor IPU pada ikon aplikasi",
    ],
  },
  {
    version: "0.7.7",
    date: "2026-10-15",
    title: "Peta lebih besar",
    items: [
      "Butang Lapisan dan skrin penuh",
      "Bar navigasi tidak lagi terangkat di iPhone",
    ],
  },
  {
    version: "0.7.6",
    date: "2026-10-15",
    title: "Sejarah IPU",
    items: ["Heatmap memenuhi lebar skrin"],
  },
  {
    version: "0.7.5",
    date: "2026-10-15",
    title: "Trend lebih kemas",
    items: ["Ramalan harian dengan kelembapan", "Penerangan ringkas dalam ⓘ"],
  },
];
