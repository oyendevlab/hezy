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
    version: "0.8.13",
    date: "2026-10-17",
    title: "Halaman negeri lebih tahan gangguan",
    items: [
      "Bila APIMS terganggu, halaman IPU negeri memaparkan notis dan dimuat semula dengan bacaan rasmi dalam kira-kira seminit",
      "Kemas kini Hezy tidak lagi gagal bila sumber data luar lambat",
    ],
  },
  {
    version: "0.8.12",
    date: "2026-10-17",
    title: "Anggaran tanah tinggi lebih jelas",
    items: [
      "Di tanah tinggi, kad Utama menerangkan nombor ialah anggaran dan memaparkan bacaan stesen terdekat",
      "Perubahan 3 jam kini dalam ⓘ sumber bacaan supaya kad lebih kemas",
    ],
  },
  {
    version: "0.8.11",
    date: "2026-10-17",
    title: "Lokasi lebih tepat: negeri, daerah dan tanah tinggi",
    items: [
      "Negeri dan ramalan MetMalaysia ikut sempadan sebenar dan daerah anda (cth. Cameron Highlands 16–24°C, bukan ramalan Perak)",
      "Di tanah tinggi seperti Cameron Highlands dan Genting, stesen tanah rendah tidak lagi dianggap bacaan rasmi",
      "Lokasi GPS jauh dari bandar senarai dinamakan ikut daerah, cth. Mersing",
    ],
  },
  {
    version: "0.8.10",
    date: "2026-10-17",
    title: "Bacaan rasmi lebih stabil",
    items: [
      "Bila pelayan APIMS terganggu seketika, Hezy cuba semula dan guna senarai stesen terakhir",
      "Bacaan tidak lengkap dimuat semula sendiri dalam beberapa minit",
    ],
  },
  {
    version: "0.8.9",
    date: "2026-10-17",
    title: "Ramalan harian guna data rasmi MetMalaysia",
    items: [
      "Suhu dan keadaan cuaca harian kini daripada MetMalaysia",
      "Bahagian Ramalan rasmi MetMalaysia lebih kemas dengan ikon pagi, petang dan malam",
    ],
  },
  {
    version: "0.8.8",
    date: "2026-10-17",
    title: "Ramalan beberapa hari lebih tepat",
    items: [
      "Pembetulan dengan bacaan rasmi kini bertahan hingga 7 hari, bukan 3",
      "Ramalan hari ke-3 hingga ke-5 tidak lagi jatuh terlalu rendah semasa jerebu",
    ],
  },
  {
    version: "0.8.7",
    date: "2026-10-17",
    title: "Graf dan ramalan per jam sepadan dengan bacaan rasmi",
    items: [
      "Ramalan per jam bermula pada jam semasa, sama seperti graf",
      "Graf dan ramalan kini dikira seperti IPU rasmi JAS (purata 24 jam), tanpa jatuh mendadak",
    ],
  },
  {
    version: "0.8.6",
    date: "2026-10-16",
    title: "Amaran dan ramalan rasmi MetMalaysia",
    items: [
      "Amaran ribut petir dan hujan lebat MetMalaysia untuk negeri anda di Utama",
      "Ramalan cuaca rasmi negeri di Trend; sensor peta kini melalui pelayan Hezy",
    ],
  },
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
