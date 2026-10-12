import { distanceKm } from "./apims";
import { nearestArea, type Area } from "./areas";
import type { SavedLocation } from "./prefs";

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

export function gpsToLocation(lat: number, lon: number): SavedLocation {
  const near = nearestArea(lat, lon);
  return {
    id: "gps",
    name: near.name,
    detail: "Lokasi semasa",
    lat: Math.round(lat * 100) / 100,
    lon: Math.round(lon * 100) / 100,
    source: "gps",
  };
}

/** Lokasi sama: id sama atau dalam 2 km (cth. lokasi GPS dan kawasan Putrajaya). */
export const samePlace = (a: SavedLocation, b: SavedLocation) =>
  a.id === b.id || distanceKm(a, b) < 2;
