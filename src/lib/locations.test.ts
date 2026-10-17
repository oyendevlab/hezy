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
  it("lokasi GPS dalam 2 km dianggap sama", async () => {
    expect(samePlace(await gpsToLocation(2.935, 101.695), PUTRAJAYA)).toBe(
      true,
    );
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

describe("gpsToLocation (v0.8.11)", () => {
  it("nama kawasan senarai bila dekat; negeri ikut sempadan", async () => {
    // Cyberjaya: Putrajaya 5 km, tetapi negeri Selangor.
    expect(await gpsToLocation(2.92, 101.65)).toMatchObject({
      id: "gps",
      name: "Putrajaya",
      detail: "Selangor",
      source: "gps",
    });
  });

  it("nama daerah bila kawasan senarai jauh", async () => {
    // Dahulu "Kluang" (73 km) dan "Labuan" (51 km).
    expect(await gpsToLocation(2.43, 103.84)).toMatchObject({
      name: "Mersing",
      detail: "Johor",
    });
    expect(await gpsToLocation(4.85, 115.41)).toMatchObject({
      name: "Lawas",
      detail: "Sarawak",
    });
  });
});
