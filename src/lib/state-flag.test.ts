import { describe, expect, it } from "vitest";
import type { Station } from "./apims";
import { isStateId, locationStateId, stateForPoint } from "./state-flag";

const station = (
  id: string,
  stateId: number,
  lat: number,
  lon: number,
): Station => ({
  id,
  name: id,
  state: "",
  stateId,
  lat,
  lon,
  ipu: 60,
  pollutant: null,
  time: "2026-10-13T08:00",
});

// Selangor = 10, Kuala Lumpur = 14. 0.09° latitud ≈ 10 km.
const stations = [
  station("shah-alam", 10, 3.1, 101.5),
  station("klang", 10, 3.0, 101.4),
  station("cheras", 14, 3.1, 101.72),
];

describe("stateForPoint", () => {
  it("negeri stesen terdekat bila jelas", () => {
    expect(stateForPoint(stations, { lat: 3.08, lon: 101.48 })).toBe(
      "selangor",
    );
  });

  it("null di sempadan: stesen negeri lain hampir sama dekat", () => {
    // Antara Shah Alam (~12 km) dan Cheras (~12 km).
    expect(stateForPoint(stations, { lat: 3.1, lon: 101.61 })).toBeNull();
    // Stesen negeri lain dalam 5 km tambahan.
    expect(stateForPoint(stations, { lat: 3.1, lon: 101.63 })).toBeNull();
  });

  it("null bila tiada stesen dalam 30 km atau negeri tidak dikenali", () => {
    expect(stateForPoint(stations, { lat: 4.5, lon: 101.5 })).toBeNull();
    expect(
      stateForPoint([station("x", 99, 3.1, 101.5)], { lat: 3.1, lon: 101.5 }),
    ).toBeNull();
  });
});

describe("locationStateId", () => {
  it("kawasan senarai bandar ikut negerinya; GPS ikut pelayan", () => {
    expect(locationStateId({ id: "area:shah-alam" }, null)).toBe("selangor");
    expect(locationStateId({ id: "gps" }, "johor")).toBe("johor");
    expect(locationStateId({ id: "gps" }, null)).toBeNull();
    expect(locationStateId({ id: "gps" }, "atlantis")).toBeNull();
  });

  it("isStateId hanya id negeri Hezy", () => {
    expect(isStateId("pulau-pinang")).toBe(true);
    expect(isStateId("Penang")).toBe(false);
  });
});
