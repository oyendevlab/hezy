import { distanceKm } from "./apims";
import { findState, nearestArea, type Area } from "./areas";
import type { SavedLocation } from "./prefs";

/** Kawasan senarai lebih jauh daripada ini: lokasi GPS dinamakan ikut daerah (v0.8.11). */
export const GPS_AREA_MAX_KM = 15;

export function areaToLocation(area: Area & { state: string }): SavedLocation {
  return {
    id: `area:${area.id}`,
    name: area.name,
    detail: area.state,
    lat: area.lat,
    lon: area.lon,
    source: "area",
  };
}

/**
 * Lokasi GPS: nama kawasan senarai terdekat jika ≤ 15 km, jika tidak nama daerah (cth. Mersing,
 * bukan "Kluang" 73 km); keterangan ialah negeri ikut sempadan (v0.8.11). Sempadan (~50 KB)
 * dimuat malas hanya bila GPS digunakan.
 */
export async function gpsToLocation(
  lat: number,
  lon: number,
): Promise<SavedLocation> {
  const point = { lat, lon };
  const near = nearestArea(lat, lon);
  const place = await import("./places")
    .then((m) => m.placeAt(point))
    .catch(() => null);
  const far = distanceKm(point, near) > GPS_AREA_MAX_KM;
  return {
    id: "gps",
    name: place && far ? place.district : near.name,
    detail: (place && findState(place.state)?.name) ?? near.state,
    lat: Math.round(lat * 100) / 100,
    lon: Math.round(lon * 100) / 100,
    source: "gps",
  };
}

/** Lokasi sama: id sama atau dalam 2 km (cth. lokasi GPS dan kawasan Putrajaya). */
export const samePlace = (a: SavedLocation, b: SavedLocation) =>
  a.id === b.id || distanceKm(a, b) < 2;
