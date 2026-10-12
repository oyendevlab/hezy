import { describe, expect, it } from "vitest";
import {
  fallbackGradient,
  malaysiaMinutes,
  moonPhase,
  skyParams,
  sunPosition,
} from "./sky";
import type { CurrentWeather } from "./weather";

const weather = (over: Partial<CurrentWeather> = {}): CurrentWeather => ({
  time: "2026-10-12T15:00",
  temperature: 31,
  code: 1,
  cloud: 40,
  visibilityKm: 20,
  isDay: true,
  precipitation: 0,
  sunrise: "2026-10-12T06:57",
  sunset: "2026-10-12T19:01",
  ...over,
});
const at = (myt: string) => new Date(`${myt}:00+08:00`);

describe("masa dan matahari", () => {
  it("minit waktu Malaysia", () => {
    expect(malaysiaMinutes(at("2026-10-12T15:30"))).toBe(15 * 60 + 30);
  });

  it("matahari: tengah hari tinggi, ufuk ketika terbit/terbenam, malam negatif", () => {
    const noon = sunPosition(13 * 60, "2026-10-12T06:57", "2026-10-12T19:01");
    expect(noon.sunEl).toBeGreaterThan(0.99);
    expect(noon.sunX).toBeCloseTo(0.5, 1);
    expect(
      sunPosition(6 * 60 + 57, "2026-10-12T06:57", "2026-10-12T19:01").sunEl,
    ).toBeCloseTo(0, 5);
    expect(sunPosition(22 * 60, null, null).sunEl).toBeLessThan(-0.5);
    expect(sunPosition(2 * 60, null, null).sunEl).toBe(-1);
    expect(sunPosition(19 * 60 + 25, null, null).sunEl).toBeLessThan(0);
    expect(sunPosition(19 * 60 + 25, null, null).sunEl).toBeGreaterThan(-0.2);
  });

  it("fasa bulan: anak bulan dan purnama yang diketahui", () => {
    // Anak bulan 21 Sep 2025 19:54 UTC; purnama 7 Okt 2025 03:47 UTC.
    // Kitaran purata: ralat hingga ~0.5 hari (0.03) memadai untuk paparan.
    const newMoon = moonPhase(new Date("2025-09-21T19:54:00Z"));
    expect(Math.min(newMoon, 1 - newMoon)).toBeLessThan(0.03);
    expect(moonPhase(new Date("2025-10-07T03:47:00Z"))).toBeCloseTo(0.5, 1);
  });
});

describe("skyParams", () => {
  it("jerebu ikut IPU; penglihatan rendah semasa hujan tidak dikira jerebu", () => {
    const clear = skyParams({
      ipu: 30,
      weather: weather(),
      wind: null,
      now: at("2026-10-12T15:00"),
    });
    expect(clear.haze).toBe(0);
    const hazy = skyParams({
      ipu: 156,
      weather: weather(),
      wind: null,
      now: at("2026-10-12T15:00"),
    });
    expect(hazy.haze).toBeGreaterThan(0.45);
    const rainy = skyParams({
      ipu: 30,
      weather: weather({
        code: 80,
        visibilityKm: 2.3,
        precipitation: 2.2,
        cloud: 98,
      }),
      wind: null,
      now: at("2026-10-12T16:00"),
    });
    expect(rainy.haze).toBe(0);
    expect(rainy.rain).toBe(0.75);
    expect(rainy.cloud).toBeCloseTo(0.98);
    const smoggy = skyParams({
      ipu: 40,
      weather: weather({ visibilityKm: 2 }),
      wind: null,
      now: at("2026-10-12T15:00"),
    });
    expect(smoggy.haze).toBeGreaterThan(0.9);
  });

  it("angin: vektor arah datang", () => {
    const p = skyParams({
      ipu: null,
      weather: null,
      wind: { direction: 90, speed: 12 },
      now: at("2026-10-12T22:00"),
    });
    expect(p.windX).toBeCloseTo(1);
    expect(p.windY).toBeCloseTo(0);
    expect(p.windSpeed).toBe(12);
    expect(p.sunEl).toBeLessThan(0);
  });

  it("latar sandaran: biru siang jernih, gelap malam", () => {
    const [top] = fallbackGradient(
      skyParams({
        ipu: 30,
        weather: weather(),
        wind: null,
        now: at("2026-10-12T12:00"),
      }),
    );
    expect(top).toBe("rgb(51 120 219)");
    const [nightTop] = fallbackGradient(
      skyParams({
        ipu: 30,
        weather: weather(),
        wind: null,
        now: at("2026-10-12T23:00"),
      }),
    );
    expect(nightTop).toBe("rgb(5 9 26)");
  });
});
