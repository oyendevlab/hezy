import { describe, expect, it } from "vitest";
import { parseStations } from "./apims";
import { HIGHLANDS, highlandAt } from "./highlands";

describe("highlandAt", () => {
  it("kawasan tanah tinggi berpenghuni", () => {
    expect(highlandAt({ lat: 4.47, lon: 101.38 })?.name).toBe(
      "Cameron Highlands",
    );
    expect(highlandAt({ lat: 4.41, lon: 101.38 })?.name).toBe(
      "Cameron Highlands",
    ); // Ringlet
    expect(highlandAt({ lat: 3.42, lon: 101.79 })).toMatchObject({
      name: "Genting Highlands",
      met: "Rc016",
    });
    expect(highlandAt({ lat: 3.71, lon: 101.74 })?.name).toBe("Bukit Fraser");
    expect(highlandAt({ lat: 5.42, lon: 100.27 })?.name).toBe("Bukit Bendera");
    expect(highlandAt({ lat: 5.99, lon: 116.58 })?.name).toBe("Kundasang");
  });

  it("bandar tanah rendah berdekatan tidak termasuk", () => {
    for (const [name, lat, lon] of [
      ["Ipoh", 4.6, 101.08],
      ["Tapah", 4.2, 101.26],
      ["Gopeng", 4.47, 101.17],
      ["Bentong", 3.52, 101.91],
      ["Air Itam", 5.4, 100.28],
      ["George Town", 5.41, 100.33],
      ["Taiping", 4.85, 100.74],
      ["Ranau", 5.95, 116.66],
      ["Batu Muda", 3.21, 101.68],
    ] as const)
      expect(highlandAt({ lat, lon }), name).toBeNull();
  });

  it("tiada stesen APIMS dalam kawasan tanah tinggi (semua < 300 m)", () => {
    // Jika JAS menambah stesen tanah tinggi, ia kekal sebagai bacaan rasmi kawasannya.
    const stations = parseStations({
      data: [
        { STATION_ID: "CA11A", LATITUDE: 4.629462, LONGITUDE: 101.116669 },
        { STATION_ID: "CA15W", LATITUDE: 3.212429, LONGITUDE: 101.682218 },
        { STATION_ID: "CA14A", LATITUDE: 3.687721, LONGITUDE: 101.524446 },
        { STATION_ID: "CA08P", LATITUDE: 5.356226, LONGITUDE: 100.30794 },
      ],
    });
    for (const s of stations) expect(highlandAt(s), s.id).toBeNull();
    expect(HIGHLANDS.every((h) => h.elevationM >= 700)).toBe(true);
  });
});
