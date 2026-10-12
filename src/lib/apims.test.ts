import { describe, expect, it } from "vitest";
import {
  distanceKm,
  nearestStation,
  parseHourly,
  parseStations,
} from "./apims";

const raw = {
  data: [
    {
      STATION_ID: "CA20B",
      STATE_NAME: "Selangor",
      STATION_LOCATION: "Shah Alam, SELANGOR",
      LATITUDE: 3.104,
      LONGITUDE: 101.556,
      API: 72,
      PARAM_SYMBOL: "**",
      RECORD_DT: "2026-10-11T23:00:00",
    },
    {
      STATION_ID: "CA16W",
      STATE_NAME: "W.P. Kuala Lumpur",
      STATION_LOCATION: "Cheras, W.P. KUALA LUMPUR",
      LATITUDE: 3.106,
      LONGITUDE: 101.718,
      API: 99,
      PARAM_SYMBOL: "*",
      RECORD_DT: "2026-10-11T23:00:00",
    },
    {
      STATION_ID: "CA13A",
      STATE_NAME: "Perak",
      STATION_LOCATION: "Seri Manjung, PERAK",
      LATITUDE: 4.2,
      LONGITUDE: 100.66,
      API: null,
      PARAM_SYMBOL: "N/A",
      RECORD_DT: "2026-10-11T23:00:00",
    },
    { STATION_ID: 12, LATITUDE: "x" },
  ],
};

describe("parseStations", () => {
  it("menormalkan bacaan stesen", () => {
    const stations = parseStations(raw);
    expect(stations).toHaveLength(3);
    expect(stations[0]).toEqual({
      id: "CA20B",
      name: "Shah Alam",
      state: "Selangor",
      stateId: null,
      lat: 3.104,
      lon: 101.556,
      ipu: 72,
      pollutant: "PM2.5",
      time: "2026-10-11T23:00",
    });
    expect(stations[1]).toMatchObject({ name: "Cheras", pollutant: "PM10" });
  });

  it("menanda stesen tanpa bacaan sebagai null", () => {
    expect(parseStations(raw)[2]).toMatchObject({
      ipu: null,
      pollutant: null,
      time: null,
    });
  });

  it("menolak respons yang tidak dijangka", () => {
    expect(() => parseStations({ rows: [] })).toThrow();
  });
});

describe("nearestStation", () => {
  const stations = parseStations(raw);

  it("memilih stesen terdekat yang ada bacaan", () => {
    const result = nearestStation(stations, { lat: 3.07, lon: 101.52 });
    expect(result?.station.id).toBe("CA20B");
    expect(result?.distanceKm).toBeCloseTo(5.5, 0);
  });

  it("memulangkan null bila tiada stesen dalam lingkungan", () => {
    expect(nearestStation(stations, { lat: 5.98, lon: 116.07 })).toBeNull();
  });

  it("mengira jarak bulatan besar", () => {
    expect(
      distanceKm({ lat: 3.14, lon: 101.69 }, { lat: 1.49, lon: 103.74 }),
    ).toBeCloseTo(292, -1);
  });
});

describe("parseHourly", () => {
  it("mengumpul bacaan setiap jam mengikut stesen dan menyusun dari awal", () => {
    const history = parseHourly({
      api_table_hourly: [
        { STATION_ID: "CA20B", DATETIME: "2026-10-12T08:00:00", API: 75 },
        { STATION_ID: "CA20B", DATETIME: "2026-10-12T07:00:00", API: 74 },
        { STATION_ID: "CA21B", DATETIME: "2026-10-12T08:00:00", API: null },
        { STATION_ID: "CA20B", DATETIME: "rosak", API: 1 },
      ],
    });
    expect(history.get("CA20B")).toEqual([
      { time: "2026-10-12T07:00", ipu: 74 },
      { time: "2026-10-12T08:00", ipu: 75 },
    ]);
    expect(history.get("CA21B")).toEqual([
      { time: "2026-10-12T08:00", ipu: null },
    ]);
  });

  it("menolak respons yang tidak dijangka", () => {
    expect(() => parseHourly({ data: [] })).toThrow();
  });
});
