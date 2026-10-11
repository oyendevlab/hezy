/** Kotak sempadan kasar Malaysia (Semenanjung, Sabah, Sarawak, Labuan). */
export const MALAYSIA_BOUNDS = {
  minLat: 0.8,
  maxLat: 7.6,
  minLon: 99.5,
  maxLon: 119.5,
} as const;

export type Coords = { lat: number; lon: number };

export type CoordsResult =
  ({ ok: true } & Coords) | { ok: false; error: string };

export function isInMalaysia({ lat, lon }: Coords): boolean {
  const b = MALAYSIA_BOUNDS;
  return (
    lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon
  );
}

/**
 * Baca `lat` dan `lon` daripada query string. Koordinat dibundarkan kepada
 * 2 titik perpuluhan (~1 km) supaya permintaan berdekatan berkongsi cache.
 */
export function parseCoords(params: URLSearchParams): CoordsResult {
  const latRaw = params.get("lat");
  const lonRaw = params.get("lon");
  if (latRaw === null || lonRaw === null) {
    return { ok: false, error: "Parameter lat dan lon diperlukan." };
  }
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, error: "lat dan lon mesti nombor." };
  }
  const coords = {
    lat: Math.round(lat * 100) / 100,
    lon: Math.round(lon * 100) / 100,
  };
  if (!isInMalaysia(coords)) {
    return { ok: false, error: "Lokasi berada di luar Malaysia." };
  }
  return { ok: true, ...coords };
}
