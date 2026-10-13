/**
 * Peta haba IPU (item 7, v0.7.0): interpolasi IDW (pemberat jarak songsang) antara stesen
 * APIMS. Jauh dari mana-mana stesen, lapisan memudar supaya tidak meneka kawasan tanpa data.
 */
export type HeatPoint = { lat: number; lon: number; ipu: number };

/** Kuasa IDW: 2 = pengaruh stesen menurun mengikut kuasa dua jarak. */
const POWER = 2;
/** Stesen di luar jarak ini tidak dikira. */
export const HEAT_RADIUS_KM = 120;
/** Ketelusan mula berkurang selepas jarak ke stesen terdekat ini. */
const FADE_FROM_KM = 30;

/** Jarak anggaran (km) — cukup tepat untuk jarak pendek di khatulistiwa. */
export function approxKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
) {
  const x = (bLon - aLon) * Math.cos(((aLat + bLat) / 2) * (Math.PI / 180));
  const y = bLat - aLat;
  return Math.hypot(x, y) * 111.32;
}

/**
 * Nilai IPU anggaran di satu titik dan kekuatan (0–1) lapisan di situ.
 * `null` bila tiada stesen dalam HEAT_RADIUS_KM.
 */
export function idw(
  points: HeatPoint[],
  lat: number,
  lon: number,
): { ipu: number; strength: number } | null {
  let sum = 0;
  let weights = 0;
  let nearest = Infinity;
  for (const p of points) {
    const d = approxKm(lat, lon, p.lat, p.lon);
    if (d > HEAT_RADIUS_KM) continue;
    if (d < 0.5) return { ipu: p.ipu, strength: 1 };
    const w = 1 / d ** POWER;
    sum += w * p.ipu;
    weights += w;
    if (d < nearest) nearest = d;
  }
  if (!weights) return null;
  const strength =
    nearest <= FADE_FROM_KM
      ? 1
      : Math.max(
          0,
          1 - (nearest - FADE_FROM_KM) / (HEAT_RADIUS_KM - FADE_FROM_KM),
        );
  return { ipu: sum / weights, strength };
}

/**
 * Warna berterusan untuk nilai IPU (peta haba dan legendanya): warna kategori diletakkan
 * di tengah julat setiap tahap dan diinterpolasi di antaranya, jadi tiada sempadan bertangga.
 */
export const HEAT_STOPS: readonly [number, string][] = [
  [25, "#3a7bd5"],
  [75, "#2e9e5b"],
  [150, "#e0a800"],
  [250, "#e8731c"],
  [400, "#d23b3b"],
];

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};

export function heatColor(ipu: number): [number, number, number] {
  if (ipu <= HEAT_STOPS[0][0]) return [...rgb(HEAT_STOPS[0][1])];
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const [v1, c1] = HEAT_STOPS[i];
    if (ipu <= v1) {
      const [v0, c0] = HEAT_STOPS[i - 1];
      const t = (ipu - v0) / (v1 - v0);
      const a = rgb(c0);
      const b = rgb(c1);
      return [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t)) as [
        number,
        number,
        number,
      ];
    }
  }
  return [...rgb(HEAT_STOPS[HEAT_STOPS.length - 1][1])];
}
