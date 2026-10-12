import { describe, expect, it } from "vitest";
import {
  compassOf,
  destination,
  meanWind,
  parseWind,
  smokeSource,
  windAt,
} from "./wind";

const SHAH_ALAM = { lat: 3.07, lon: 101.52 };
const KUCHING = { lat: 1.55, lon: 110.36 };
const KOTA_BHARU = { lat: 6.13, lon: 102.24 };
const PERLIS = { lat: 6.44, lon: 100.2 };

describe("meanWind dan compassOf", () => {
  it("purata vektor, bukan purata nombor arah", () => {
    const s = {
      times: ["a", "b", "c"],
      speed: [10, 10, null],
      direction: [350, 10, 90],
    };
    expect(meanWind(s, "b", 1)).toEqual({ direction: 0, speed: 10 });
    expect(meanWind(s, "z")).toBeNull();
  });

  it("menukar darjah kepada 8 arah", () => {
    expect(compassOf(0)).toBe("utara");
    expect(compassOf(140)).toBe("tenggara");
    expect(compassOf(225)).toBe("barat-daya");
    expect(compassOf(350)).toBe("utara");
    expect(compassOf(-45)).toBe("barat-laut");
  });
});

describe("destination", () => {
  it("bergerak ke arah bearing", () => {
    const p = destination({ lat: 0, lon: 100 }, 90, 111.2);
    expect(p.lat).toBeCloseTo(0, 3);
    expect(p.lon).toBeCloseTo(101, 1);
  });
});

describe("smokeSource", () => {
  it("angin barat daya / tenggara ke Lembah Klang datang dari Sumatera", () => {
    expect(smokeSource(SHAH_ALAM, 225)).toBe("sumatera");
    // Data 850 hPa 12 Okt 2026: ~140°.
    expect(smokeSource(SHAH_ALAM, 140)).toBe("sumatera");
  });

  it("angin selatan ke Kuching datang dari Kalimantan", () => {
    expect(smokeSource(KUCHING, 180)).toBe("kalimantan");
  });

  it("Kalimantan terlalu jauh untuk Johor Bahru (> 600 km)", () => {
    expect(smokeSource({ lat: 1.49, lon: 103.74 }, 121)).toBeNull();
  });

  it("angin timur laut (monsun) tiada sumber jerebu biasa", () => {
    expect(smokeSource(KOTA_BHARU, 45)).toBeNull();
    expect(smokeSource(PERLIS, 0)).toBeNull();
  });
});

describe("windAt", () => {
  const series = parseWind({
    hourly: {
      time: ["2026-10-12T11:00", "2026-10-12T12:00", "2026-10-12T13:00"],
      wind_speed_850hPa: [12, 14, 13],
      wind_direction_850hPa: [140, 145, 150],
    },
  });

  it("angin semasa dengan arah dan sumber", () => {
    expect(windAt(series, SHAH_ALAM, "2026-10-12T12:00")).toEqual({
      direction: 145,
      speed: 13,
      compass: "tenggara",
      source: "sumatera",
    });
  });

  it("angin tenang tiada sumber", () => {
    const calm = { ...series, speed: [1, 2, 1] };
    expect(windAt(calm, SHAH_ALAM, "2026-10-12T12:00")?.source).toBeNull();
  });

  it("menolak respons rosak", () => {
    expect(() => parseWind({ hourly: { time: ["a"] } })).toThrow();
  });
});
