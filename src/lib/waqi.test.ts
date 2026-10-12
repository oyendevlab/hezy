import { describe, expect, it } from "vitest";
import type { Station } from "./apims";
import { parseSensors, waqiBoundsUrl } from "./waqi";

const NOW = new Date("2026-10-12T03:00:00Z");
const APIMS: Station[] = [
  {
    id: "CA0011",
    name: "Batu Muda",
    state: "Kuala Lumpur",
    stateId: 14,
    lat: 3.2124,
    lon: 101.6822,
    ipu: 70,
    pollutant: "**",
    time: "2026-10-12T10:00",
  },
];

const raw = (over: Record<string, unknown>) => ({
  lat: 3.05,
  lon: 101.55,
  uid: -2871205,
  aqi: "75",
  station: { name: "Jalan Anggun 3P", time: "2026-10-12T02:32:15Z" },
  ...over,
});

describe("parseSensors", () => {
  it("menerima sensor komuniti di Malaysia dan menukar masa ke waktu Malaysia", () => {
    expect(parseSensors({ status: "ok", data: [raw({})] }, APIMS, NOW)).toEqual(
      [
        {
          uid: -2871205,
          name: "Jalan Anggun 3P",
          lat: 3.05,
          lon: 101.55,
          aqi: 75,
          time: "2026-10-12T10:32",
        },
      ],
    );
  });

  it("membuang pendua APIMS, luar negara, bacaan lapuk dan AQI tiada", () => {
    const data = [
      raw({
        uid: 2625,
        lat: 3.2124,
        lon: 101.6822,
        station: {
          name: "Batu Muda, Kuala Lumpur",
          time: "2026-10-12T11:00:00+09:00",
        },
      }),
      raw({
        station: { name: "Central, Singapore", time: "2026-10-12T02:00:00Z" },
      }),
      raw({
        station: { name: "เทศบาลนครหาดใหญ่", time: "2026-10-12T02:00:00Z" },
      }),
      raw({ station: { name: "Lama", time: "2026-10-11T20:00:00Z" } }),
      raw({ aqi: "-" }),
      raw({ lat: 13.7, lon: 100.5 }),
    ];
    expect(parseSensors({ status: "ok", data }, APIMS, NOW)).toEqual([]);
  });

  it("memulangkan senarai kosong untuk respons ralat", () => {
    expect(
      parseSensors({ status: "error", data: "Invalid key" }, APIMS, NOW),
    ).toEqual([]);
    expect(parseSensors(null, APIMS, NOW)).toEqual([]);
  });

  it("membina URL kotak sempadan Malaysia", () => {
    expect(waqiBoundsUrl("abc")).toBe(
      "https://api.waqi.info/v2/map/bounds?latlng=0.8,99.5,7.6,119.5&networks=all&token=abc",
    );
  });
});
