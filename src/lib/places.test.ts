import { describe, expect, it } from "vitest";
import { STATES } from "./areas";
import { decodePolyline, placeAt } from "./places";
import { DISTRICTS } from "./places-data";

// Titik audit 17 Okt 2026 (bandar dan kawasan yang dahulu salah negeri).
const TOWNS: [name: string, lat: number, lon: number, state: string][] = [
  ["Mersing", 2.43, 103.84, "johor"],
  ["Lawas", 4.85, 115.41, "sarawak"],
  ["Tanah Rata", 4.47, 101.38, "pahang"],
  ["Brinchang", 4.49, 101.39, "pahang"],
  ["Genting Highlands", 3.42, 101.79, "pahang"],
  ["Bukit Fraser", 3.71, 101.74, "pahang"],
  ["Bentong", 3.52, 101.91, "pahang"],
  ["Raub", 3.79, 101.86, "pahang"],
  ["Gua Musang", 4.88, 101.97, "kelantan"],
  ["Gerik", 5.43, 101.13, "perak"],
  ["Pulau Tioman", 2.79, 104.17, "pahang"],
  ["Pulau Pangkor", 4.22, 100.55, "perak"],
  ["Pulau Redang", 5.78, 103.01, "terengganu"],
  ["Rawang", 3.32, 101.58, "selangor"],
  ["Kuala Kubu Bharu", 3.56, 101.65, "selangor"],
  ["Cyberjaya", 2.92, 101.65, "selangor"],
  ["Kajang", 2.99, 101.79, "selangor"],
  ["Bangi", 2.92, 101.78, "selangor"],
  ["Semenyih", 2.95, 101.84, "selangor"],
  ["Ampang", 3.15, 101.76, "selangor"],
  ["Putrajaya", 2.93, 101.69, "putrajaya"],
  ["Parit Buntar", 5.13, 100.49, "perak"],
  ["Jasin", 2.31, 102.43, "melaka"],
  ["Tampin", 2.47, 102.23, "negeri-sembilan"],
  ["Gemas", 2.58, 102.61, "negeri-sembilan"],
  ["Sipitang", 5.08, 115.55, "sabah"],
  ["Kundasang", 5.99, 116.58, "sabah"],
  ["Langkawi (Kuah)", 6.32, 99.85, "kedah"],
  ["Labuan", 5.28, 115.24, "labuan"],
];

describe("placeAt", () => {
  it("setiap kawasan dalam senarai lokasi berada dalam negerinya", () => {
    for (const state of STATES)
      for (const area of state.areas)
        expect(placeAt(area)?.state, area.name).toBe(state.id);
  });

  it("bandar dekat sempadan negeri dipadankan dengan negeri sebenar", () => {
    for (const [name, lat, lon, state] of TOWNS)
      expect(placeAt({ lat, lon })?.state, name).toBe(state);
  });

  it("daerah dan ramalan daerah MetMalaysia", () => {
    expect(placeAt({ lat: 4.47, lon: 101.38 })).toEqual({
      district: "Cameron Highlands",
      state: "pahang",
      met: "Ds038",
    });
    expect(placeAt({ lat: 2.43, lon: 103.84 })).toMatchObject({
      district: "Mersing",
      met: "Ds086",
    });
    expect(placeAt({ lat: 2.93, lon: 101.69 })).toMatchObject({
      district: "Putrajaya",
      met: "Ds062",
    });
    expect(placeAt({ lat: 2.92, lon: 101.65 })?.district).toBe("Sepang");
  });

  it("pantai di luar poligon dipadankan dengan sempadan terdekat; luar negara null", () => {
    // Laut 3 km dari pantai Kuala Terengganu.
    expect(placeAt({ lat: 5.36, lon: 103.17 })?.state).toBe("terengganu");
    expect(placeAt({ lat: 13.75, lon: 100.5 })).toBeNull(); // Bangkok
    expect(placeAt({ lat: 3.59, lon: 98.67 })).toBeNull(); // Medan
  });

  it("setiap daerah ada negeri sah dan ramalan MetMalaysia", () => {
    const ids = new Set(STATES.map((s) => s.id));
    for (const [name, state, met, rings] of DISTRICTS) {
      expect(ids.has(state), name).toBe(true);
      expect(met, name).toMatch(/^(Ds|Tn)\d{3}$/);
      expect(rings.length, name).toBeGreaterThan(0);
    }
    expect(new Set(DISTRICTS.map((d) => d[0])).size).toBe(DISTRICTS.length);
  });
});

describe("decodePolyline", () => {
  it("menyahkod contoh rujukan Google (ketepatan 1e5)", () => {
    const points = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@", 1e5);
    expect(Array.from(points)).toEqual([
      -120.2, 38.5, -120.95, 40.7, -126.453, 43.252,
    ]);
  });
});
