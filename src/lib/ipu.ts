/**
 * Pengiraan Indeks Pencemar Udara (IPU) daripada PM2.5.
 *
 * Sumber: JAS, "Pengiraan Indeks Pencemar Udara (IPU)" — formula sub-indeks PM2.5
 * yang dimodifikasi mengikut standard USEPA, menggunakan purata 24 jam (µg/m³).
 * https://www.doe.gov.my/wp-content/uploads/2021/09/API_Calculation.pdf
 *
 * IPU rasmi ialah sub-indeks maksimum bagi 6 pencemar. Hezy hanya mengira sub-indeks
 * PM2.5 (pencemar utama semasa jerebu), jadi nilainya ialah anggaran.
 */

const PM25_BANDS: readonly { below: number; ipu: (x: number) => number }[] = [
  { below: 12.1, ipu: (x) => 4.1667 * x },
  { below: 75.5, ipu: (x) => 0.7741 * (x - 12.1) + 51 },
  { below: 150.5, ipu: (x) => 1.3218 * (x - 75.5) + 101 },
  { below: 250.5, ipu: (x) => 0.9909 * (x - 150.5) + 201 },
  { below: 350.5, ipu: (x) => 0.9909 * (x - 250.5) + 301 },
  { below: Infinity, ipu: (x) => 0.6604 * (x - 350.5) + 401 },
];

/** Tukar purata PM2.5 24 jam (µg/m³) kepada IPU. */
export function pm25ToIpu(pm25: number): number {
  if (!Number.isFinite(pm25) || pm25 < 0) {
    throw new RangeError(`Kepekatan PM2.5 tidak sah: ${pm25}`);
  }
  const band =
    PM25_BANDS.find((b) => pm25 < b.below) ?? PM25_BANDS[PM25_BANDS.length - 1];
  return Math.max(0, Math.round(band.ipu(pm25)));
}

/** IPU sub-indeks PM2.5 → kepekatan PM2.5 setara (songsangan {@link pm25ToIpu}). */
export function ipuToPm25(ipu: number): number {
  if (!Number.isFinite(ipu) || ipu < 0) {
    throw new RangeError(`IPU tidak sah: ${ipu}`);
  }
  if (ipu <= 50) return ipu / 4.1667;
  if (ipu <= 100) return (Math.max(ipu, 51) - 51) / 0.7741 + 12.1;
  if (ipu <= 200) return (Math.max(ipu, 101) - 101) / 1.3218 + 75.5;
  if (ipu <= 300) return (Math.max(ipu, 201) - 201) / 0.9909 + 150.5;
  if (ipu <= 400) return (Math.max(ipu, 301) - 301) / 0.9909 + 250.5;
  return (ipu - 401) / 0.6604 + 350.5;
}

/** Bilangan minimum bacaan sejam dalam tetingkap 24 jam (75%) untuk purata yang sah. */
export const MIN_HOURS_FOR_AVERAGE = 18;

/**
 * Purata bergerak 24 jam. Setiap kedudukan `i` ialah purata bacaan `i-23..i`,
 * atau `null` jika kurang daripada {@link MIN_HOURS_FOR_AVERAGE} bacaan tersedia.
 */
export function rolling24hAverage(
  values: readonly (number | null)[],
): (number | null)[] {
  return values.map((_, i) => {
    const window = values
      .slice(Math.max(0, i - 23), i + 1)
      .filter((v): v is number => v !== null);
    if (window.length < MIN_HOURS_FOR_AVERAGE) return null;
    return window.reduce((sum, v) => sum + v, 0) / window.length;
  });
}

export type IpuCategoryKey =
  "baik" | "sederhana" | "tidak-sihat" | "sangat-tidak-sihat" | "berbahaya";

export type IpuCategory = {
  key: IpuCategoryKey;
  label: string;
  /** Had atas julat IPU; `null` untuk kategori tertinggi. */
  max: number | null;
};

export const IPU_CATEGORIES: readonly IpuCategory[] = [
  { key: "baik", label: "Baik", max: 50 },
  { key: "sederhana", label: "Sederhana", max: 100 },
  { key: "tidak-sihat", label: "Tidak Sihat", max: 200 },
  { key: "sangat-tidak-sihat", label: "Sangat Tidak Sihat", max: 300 },
  { key: "berbahaya", label: "Berbahaya", max: null },
];

export function ipuCategory(ipu: number): IpuCategory {
  return (
    IPU_CATEGORIES.find((c) => c.max === null || ipu <= c.max) ??
    IPU_CATEGORIES[4]
  );
}

/** IPU melebihi 500 ialah tahap Kecemasan menurut JAS. */
export function isEmergency(ipu: number): boolean {
  return ipu > 500;
}
