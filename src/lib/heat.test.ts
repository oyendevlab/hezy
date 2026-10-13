import { describe, expect, it } from "vitest";
import { HEAT_RADIUS_KM, approxKm, heatColor, idw } from "./heat";

const KLANG = { lat: 3.01, lon: 101.408, ipu: 146 };
const SHAH_ALAM = { lat: 3.104, lon: 101.556, ipu: 72 };

describe("approxKm", () => {
  it("Klang ke Shah Alam ≈ 19 km", () => {
    const d = approxKm(KLANG.lat, KLANG.lon, SHAH_ALAM.lat, SHAH_ALAM.lon);
    expect(d).toBeGreaterThan(17);
    expect(d).toBeLessThan(21);
  });
});

describe("idw", () => {
  it("di stesen: nilai stesen itu", () => {
    expect(idw([KLANG, SHAH_ALAM], KLANG.lat, KLANG.lon)).toEqual({
      ipu: 146,
      strength: 1,
    });
  });
  it("di tengah dua stesen: antara kedua-dua nilai", () => {
    const r = idw([KLANG, SHAH_ALAM], 3.057, 101.482)!;
    expect(r.ipu).toBeGreaterThan(72);
    expect(r.ipu).toBeLessThan(146);
    expect(r.strength).toBe(1);
  });
  it("memudar jauh dari stesen; null di luar radius", () => {
    const far = idw([KLANG], KLANG.lat + 0.8, KLANG.lon)!; // ~89 km
    expect(far.strength).toBeGreaterThan(0);
    expect(far.strength).toBeLessThan(0.5);
    expect(
      idw([KLANG], KLANG.lat + HEAT_RADIUS_KM / 100, KLANG.lon),
    ).toBeNull();
  });
});

describe("heatColor", () => {
  it("warna kategori di tengah julat; berterusan di antaranya", () => {
    expect(heatColor(75)).toEqual([0x2e, 0x9e, 0x5b]);
    expect(heatColor(0)).toEqual([0x3a, 0x7b, 0xd5]);
    expect(heatColor(900)).toEqual([0xd2, 0x3b, 0x3b]);
    const mid = heatColor(112.5); // antara Sederhana dan Tidak Sihat
    expect(mid[0]).toBeGreaterThan(0x2e);
    expect(mid[0]).toBeLessThan(0xe0);
  });
});
