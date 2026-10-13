import { describe, expect, it } from "vitest";
import {
  WIND_GRID,
  edgeDistance,
  parseWindGrid,
  sampleWind,
  toUV,
  windGridPoints,
  windGridUrl,
} from "./wind-grid";

describe("toUV", () => {
  it("angin dari utara mengalir ke selatan; dari barat ke timur", () => {
    const [u1, v1] = toUV(10, 0);
    expect(u1).toBeCloseTo(0);
    expect(v1).toBeCloseTo(-10);
    const [u2, v2] = toUV(10, 270);
    expect(u2).toBeCloseTo(10);
    expect(v2).toBeCloseTo(0);
  });
});

describe("grid angin", () => {
  it("rantau Asia Tenggara 2° (285 titik) dalam satu URL", () => {
    expect(WIND_GRID.nx * WIND_GRID.ny).toBe(285);
    expect(windGridPoints()).toHaveLength(WIND_GRID.nx * WIND_GRID.ny);
    expect(windGridUrl()).toContain("wind_direction_850hPa");
  });

  const item = (speed: number, dir: number) => ({
    hourly: {
      time: ["2026-10-13T19:00"],
      wind_speed_850hPa: [speed],
      wind_direction_850hPa: [dir],
    },
  });

  it("menghurai respons berbilang lokasi kepada u/v", () => {
    const n = WIND_GRID.nx * WIND_GRID.ny;
    const g = parseWindGrid(Array.from({ length: n }, () => item(20, 90)));
    expect(g.u[0]).toBeCloseTo(-20);
    expect(g.v[0]).toBeCloseTo(0);
    expect(g.time).toBe("2026-10-13T19:00");
    expect(() => parseWindGrid([item(1, 1)])).toThrow();
  });

  it("interpolasi bilinear dan null di luar grid", () => {
    const grid = {
      lat0: 0,
      lon0: 0,
      step: 1,
      nx: 2,
      ny: 2,
      u: [0, 10, 0, 10],
      v: [0, 0, 4, 4],
      time: null,
    };
    expect(sampleWind(grid, 0.5, 0.5)).toEqual([5, 2]);
    expect(sampleWind(grid, 0, 1)).toEqual([10, 0]);
    expect(sampleWind(grid, 2, 0)).toBeNull();
  });
});

describe("edgeDistance", () => {
  it("tengah grid jauh dari tepi; di tepi = 0; di luar negatif", () => {
    const grid = {
      lat0: 0,
      lon0: 0,
      step: 1,
      nx: 5,
      ny: 5,
      u: [],
      v: [],
      time: null,
    };
    expect(edgeDistance(grid, 2, 2)).toBe(2);
    expect(edgeDistance(grid, 0, 2)).toBe(0);
    expect(edgeDistance(grid, -1, 2)).toBe(-1);
  });
});
