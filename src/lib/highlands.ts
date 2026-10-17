/**
 * Kawasan tanah tinggi berpenghuni (v0.8.11). Semua 68 stesen APIMS di bawah 300 m (Open-Meteo
 * Elevation, 17 Okt 2026), jadi bacaan stesen tanah rendah tidak dianggap bacaan rasmi lokasi
 * di sini (cth. Genting ~1,700 m dan Batu Muda 26 km) — nombor utama menjadi anggaran yang
 * dibetulkan dengan stesen berdekatan, dengan penjelasan.
 *
 * Bulatan sahaja (tanpa poligon) supaya murah diimport di pelayar. `met` ialah ramalan pusat
 * rekreasi MetMalaysia bila suhunya jauh berbeza daripada ramalan daerah (Genting 18–25°C,
 * daerah Bentong 24–33°C).
 */

import { distanceKm } from "./apims";

export type Highland = {
  name: string;
  lat: number;
  lon: number;
  radiusKm: number;
  /** Anggaran ketinggian kawasan berpenghuni (m). */
  elevationM: number;
  /** Id ramalan MetMalaysia (pusat rekreasi), jika ada. */
  met?: string;
};

export const HIGHLANDS: readonly Highland[] = [
  // Tanah Rata, Brinchang, Ringlet, Kuala Terla dan Blue Valley.
  {
    name: "Cameron Highlands",
    lat: 4.5,
    lon: 101.4,
    radiusKm: 15,
    elevationM: 1400,
  },
  {
    name: "Genting Highlands",
    lat: 3.4236,
    lon: 101.7933,
    radiusKm: 4,
    elevationM: 1700,
    met: "Rc016",
  },
  {
    name: "Bukit Fraser",
    lat: 3.7117,
    lon: 101.7372,
    radiusKm: 4,
    elevationM: 1300,
    met: "Rc014",
  },
  {
    name: "Bukit Bendera",
    lat: 5.4241,
    lon: 100.269,
    radiusKm: 1.5,
    elevationM: 700,
  },
  { name: "Bukit Larut", lat: 4.86, lon: 100.8, radiusKm: 2, elevationM: 1100 },
  {
    name: "Gunung Jerai",
    lat: 5.79,
    lon: 100.43,
    radiusKm: 2.5,
    elevationM: 900,
  },
  {
    name: "Kundasang",
    lat: 5.9876,
    lon: 116.5772,
    radiusKm: 5,
    elevationM: 1200,
    met: "Rc503",
  },
  {
    name: "Taman Kinabalu",
    lat: 6.0059,
    lon: 116.5427,
    radiusKm: 3,
    elevationM: 1500,
    met: "Rc501",
  },
  { name: "Bario", lat: 3.7356, lon: 115.4789, radiusKm: 8, elevationM: 1000 },
  { name: "Ba'kelalan", lat: 3.98, lon: 115.62, radiusKm: 5, elevationM: 900 },
];

/** Kawasan tanah tinggi terdekat yang merangkumi titik, atau null. */
export function highlandAt(point: {
  lat: number;
  lon: number;
}): Highland | null {
  let best: { h: Highland; d: number } | null = null;
  for (const h of HIGHLANDS) {
    const d = distanceKm(point, h);
    if (d <= h.radiusKm && (!best || d < best.d)) best = { h, d };
  }
  return best?.h ?? null;
}
