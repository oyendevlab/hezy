/**
 * Daerah dan negeri sebenar bagi koordinat (v0.8.11), daripada sempadan geoBoundaries yang
 * dipermudahkan (`places-data.ts`, dijana oleh scripts/build-places.mjs). Sebelum ini negeri
 * diteka daripada stesen APIMS terdekat, yang salah dekat sempadan (cth. Kajang → Putrajaya,
 * Mersing → Pahang, Cameron Highlands → Perak).
 *
 * Titik di luar semua poligon (pulau sangat kecil yang dibuang, pantai, ralat GPS) dipadankan
 * dengan sempadan terdekat dalam PLACE_MAX_OFFSHORE_KM.
 */

import { DISTRICTS, POLYLINE_PRECISION } from "./places-data";

export type Place = {
  /** Nama daerah, cth. "Cameron Highlands". */
  district: string;
  /** Id negeri dalam areas.ts, cth. "pahang". */
  state: string;
  /** Id ramalan daerah MetMalaysia (cth. "Ds038"), jika ada. */
  met: string | null;
};

export const PLACE_MAX_OFFSHORE_KM = 15;

type Ring = {
  /** [lon, lat, lon, lat, …] */
  points: Float64Array;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};
type Unit = Place & { rings: Ring[] };

/** Nyahkod polyline Google (lat, lon berselang-seli) kepada [lon, lat, …]. */
export function decodePolyline(text: string, precision: number): Float64Array {
  const values: number[] = [];
  let index = 0;
  let lat = 0;
  let lon = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = text.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < text.length) {
    lat += next();
    lon += next();
    values.push(lon / precision, lat / precision);
  }
  return Float64Array.from(values);
}

function toRing(points: Float64Array): Ring {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    minX = Math.min(minX, points[i]);
    maxX = Math.max(maxX, points[i]);
    minY = Math.min(minY, points[i + 1]);
    maxY = Math.max(maxY, points[i + 1]);
  }
  return { points, minX, maxX, minY, maxY };
}

let units: Unit[] | null = null;

/** Dinyahkod sekali (malas) supaya modul murah diimport. */
function loadUnits(): Unit[] {
  units ??= DISTRICTS.map(([district, state, met, rings]) => ({
    district,
    state,
    met,
    rings: rings.map((r) => toRing(decodePolyline(r, POLYLINE_PRECISION))),
  }));
  return units;
}

function inRing(x: number, y: number, ring: Ring): boolean {
  if (x < ring.minX || x > ring.maxX || y < ring.minY || y > ring.maxY)
    return false;
  const p = ring.points;
  let inside = false;
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
    const xi = p[i];
    const yi = p[i + 1];
    const xj = p[j];
    const yj = p[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

/** Jarak (km) titik ke segmen, dalam unjuran setempat. */
function segmentKm(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const kx = 111.32 * Math.cos((y * Math.PI) / 180);
  const ky = 110.57;
  const px = (ax - x) * kx;
  const py = (ay - y) * ky;
  const dx = (bx - ax) * kx;
  const dy = (by - ay) * ky;
  const length = dx * dx + dy * dy;
  const t =
    length === 0 ? 0 : Math.max(0, Math.min(1, -(px * dx + py * dy) / length));
  return Math.hypot(px + t * dx, py + t * dy);
}

const toPlace = ({ district, state, met }: Unit): Place => ({
  district,
  state,
  met,
});

/** Daerah dan negeri bagi titik, atau null bila di luar Malaysia (> 15 km dari sempadan). */
export function placeAt(point: { lat: number; lon: number }): Place | null {
  const { lon: x, lat: y } = point;
  const all = loadUnits();
  // Genap-ganjil merentas semua gelang daerah: betul untuk pulau dan lubang.
  for (const unit of all) {
    let inside = false;
    for (const ring of unit.rings) if (inRing(x, y, ring)) inside = !inside;
    if (inside) return toPlace(unit);
  }
  let best: { unit: Unit; km: number } | null = null;
  for (const unit of all)
    for (const { points: p } of unit.rings)
      for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
        const km = segmentKm(x, y, p[j], p[j + 1], p[i], p[i + 1]);
        if (km <= PLACE_MAX_OFFSHORE_KM && (!best || km < best.km))
          best = { unit, km };
      }
  return best ? toPlace(best.unit) : null;
}
