import { describe, expect, it } from "vitest";
import {
  currentWeather,
  isWet,
  parseWeather,
  weatherKind,
  weatherUrl,
} from "./weather";

const RAW = {
  hourly: {
    time: ["2026-10-12T15:00", "2026-10-12T16:00"],
    wind_speed_850hPa: [7, 7.1],
    wind_direction_850hPa: [130, 135],
    cloud_cover: [90, 98],
    visibility: [3000, 2280],
    temperature_2m: [27.1, 26.3],
    weather_code: [3, 80],
    is_day: [1, 1],
    precipitation: [0, 2.2],
  },
  daily: {
    time: ["2026-10-12", "2026-10-13"],
    sunrise: ["2026-10-12T06:57", "2026-10-13T06:57"],
    sunset: ["2026-10-12T19:01", "2026-10-13T19:01"],
    weather_code: [95, 80],
    temperature_2m_max: [30.6, 31.6],
    temperature_2m_min: [23.9, 23.7],
    precipitation_probability_max: [90, 40],
    wind_speed_10m_max: [8.4, 12.6],
    wind_direction_10m_dominant: [135, 180],
  },
};

describe("parseWeather dan currentWeather", () => {
  it("membaca cuaca sejam, harian dan waktu matahari", () => {
    const s = parseWeather(RAW);
    expect(s.days).toEqual([
      {
        date: "2026-10-12",
        code: 95,
        max: 31,
        min: 24,
        rainChance: 90,
        windMax: 8,
        windDir: 135,
      },
      {
        date: "2026-10-13",
        code: 80,
        max: 32,
        min: 24,
        rainChance: 40,
        windMax: 13,
        windDir: 180,
      },
    ]);
    expect(currentWeather(s, "2026-10-12T16:00")).toEqual({
      time: "2026-10-12T16:00",
      temperature: 26,
      code: 80,
      cloud: 98,
      visibilityKm: 2.3,
      isDay: true,
      precipitation: 2.2,
      sunrise: "2026-10-12T06:57",
      sunset: "2026-10-12T19:01",
    });
    expect(currentWeather(s, "2026-10-12T20:00")).toBeNull();
  });

  it("menolak respons tanpa medan wajib", () => {
    expect(() => parseWeather({ hourly: { time: ["a"] } })).toThrow();
    expect(() => parseWeather(null)).toThrow();
  });

  it("URL satu permintaan untuk cuaca, angin dan harian", () => {
    const url = weatherUrl(2.9, 101.7);
    expect(url).toContain("wind_direction_850hPa");
    expect(url).toContain("daily=sunrise%2Csunset");
  });
});

describe("weatherKind dan isWet", () => {
  it("kumpulan kod WMO", () => {
    expect([0, 2, 3, 45, 53, 63, 81, 95].map(weatherKind)).toEqual([
      "cerah",
      "separa",
      "mendung",
      "kabus",
      "gerimis",
      "hujan",
      "hujan",
      "ribut",
    ]);
    expect(isWet(80)).toBe(true);
    expect(isWet(3, 0.5)).toBe(true);
    expect(isWet(3, 0)).toBe(false);
  });
});
