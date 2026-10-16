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
    version: "0.8.5",
    date: "2026-10-16",
    title: "Anggaran lebih tepat di kawasan tanpa stesen",
    items: [
      "Kawasan jauh dari stesen APIMS kini dibetulkan dengan bacaan rasmi stesen berdekatan",
      "Bacaan rasmi terbaharu muncul lebih cepat selepas JAS menerbitkannya",
    ],
  },
  {
    version: "0.8.4",
    date: "2026-10-16",
    title: "Amaran lebih tepat pada masanya",
    items: [
      "Semakan amaran IPU dijalankan lebih kerap supaya notifikasi tidak lewat",
      "Ringkasan pagi, status sekolah dan ramalan esok mempunyai jadual sandaran",
    ],
  },
  {
    version: "0.8.3",
    date: "2026-10-16",
    title: "Ramalan harian lebih tepat",
    items: [
      "Ramalan harian kini dikira seperti IPU rasmi JAS (purata 24 jam) dan bermula daripada bacaan rasmi terkini",
      "Model ramalan baharu diuji di latar belakang sebelum digunakan sepenuhnya",
    ],
  },
  {
    version: "0.8.2",
    date: "2026-10-16",
    title: "Lebih laju dan stabil",
    items: [
      "Bacaan IPU dimuatkan lebih cepat, terutama lokasi baharu",
      "Bacaan tetap dipaparkan walaupun data cuaca lambat atau sumber terganggu",
    ],
  },
  {
    version: "0.8.1",
    date: "2026-10-16",
    title: "Keselamatan diperkukuh",
    items: [
      "Kemas kini keselamatan penting untuk pelayan Hezy",
      "Perlindungan tambahan untuk notifikasi dan halaman aplikasi",
    ],
  },
  {
    version: "0.8.0",
    date: "2026-10-16",
    title: "Hezy 0.8: semua paparan dipolish",
    items: [
      "Utama, Trend, Lokasi dan Tetapan direka semula",
      "Ikon baharu, notifikasi lebih ringkas, kad kongsi lebih kemas",
    ],
  },
  {
    version: "0.7.15",
    date: "2026-10-16",
    title: "Masa AM/PM dan kad kongsi",
    items: ["Masa AM/PM yang seragam", "Kad kongsi IPU lebih kemas"],
  },
  {
    version: "0.7.14",
    date: "2026-10-16",
    title: "Kemas kini kecil",
    items: [
      "Apa yang baharu kini 3 keluaran terkini sahaja",
      "Butang Padam di sebelah Padam data",
    ],
  },
  {
    version: "0.7.13",
    date: "2026-10-16",
    title: "Notifikasi lebih ringkas",
    items: [
      "Notifikasi dan amaran digabung",
      "Tetapan amaran muncul bila banner dihidupkan",
      "Padam data kini dalam kad Tentang",
    ],
  },
  {
    version: "0.7.12",
    date: "2026-10-16",
    title: "Ikon baharu dan penafian",
    items: [
      "Ikon awan baharu yang lebih comel",
      "Privasi dan Penafian di skrin alu-aluan",
    ],
  },
  {
    version: "0.7.11",
    date: "2026-10-16",
    title: "Warna lebih lembut",
    items: ["Suis dan pilihan kini hijau lembut, berbeza daripada ikon"],
  },
  {
    version: "0.7.10",
    date: "2026-10-16",
    title: "Tetapan lebih tersusun",
    items: [
      "Waktu senyap dan notifikasi ujian kini di bawah Amaran",
      "Kad Tentang dan kredit pembangun lebih ringkas",
    ],
  },
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
