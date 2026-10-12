import { describe, expect, it } from "vitest";
import { gpsToLocation, samePlace } from "./locations";
import type { SavedLocation } from "./prefs";

const PUTRAJAYA: SavedLocation = {
  id: "area:putrajaya",
  name: "Putrajaya",
  detail: "W.P. Putrajaya",
  lat: 2.93,
  lon: 101.69,
  source: "area",
};

describe("samePlace", () => {
  it("sama bila id sama", () => {
    expect(samePlace(PUTRAJAYA, { ...PUTRAJAYA, lat: 5, lon: 100 })).toBe(true);
  });
  it("lokasi GPS dalam 2 km dianggap sama", () => {
    expect(samePlace(gpsToLocation(2.935, 101.695), PUTRAJAYA)).toBe(true);
  });
  it("bandar lain tidak sama", () => {
    expect(
      samePlace(PUTRAJAYA, {
        ...PUTRAJAYA,
        id: "area:klang",
        lat: 3.04,
        lon: 101.45,
      }),
    ).toBe(false);
  });
});
