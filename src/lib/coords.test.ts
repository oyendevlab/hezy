import { describe, expect, it } from "vitest";
import { parseCoords } from "./coords";

const parse = (query: string) => parseCoords(new URLSearchParams(query));

describe("parseCoords", () => {
  it("menerima dan membundarkan koordinat dalam Malaysia", () => {
    expect(parse("lat=3.07312&lon=101.51834")).toEqual({
      ok: true,
      lat: 3.07,
      lon: 101.52,
    });
  });

  it("menolak parameter yang tiada atau bukan nombor", () => {
    expect(parse("lat=3.07").ok).toBe(false);
    expect(parse("lat=abc&lon=101").ok).toBe(false);
  });

  it("menolak lokasi di luar Malaysia", () => {
    expect(parse("lat=1.35&lon=99.0").ok).toBe(false);
    expect(parse("lat=13.75&lon=100.5").ok).toBe(false);
  });
});
