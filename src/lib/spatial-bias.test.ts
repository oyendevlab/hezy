import { describe, expect, it } from "vitest";
import type { Station } from "./apims";
import { ipuToPm25 } from "./ipu";
import {
  SPATIAL_DECAY_HOURS,
  applySpatialBias,
  idwBias,
  stationBiases,
  type StationBias,
} from "./spatial-bias";

const NOW_KEY = "2026-10-16T21:00";

/** Siri 48 jam (15–16 Okt) dengan PM2.5 malar. */
function series(pm25: number) {
  const times = Array.from({ length: 48 }, (_, h) => {
    const date = new Date(Date.UTC(2026, 9, 15, h));
    return date.toISOString().slice(0, 13) + ":00";
  });
  return { times, pm25: times.map(() => pm25) };
}

const station = (over: Partial<Station>): Station => ({
  id: "A",
  name: "Stesen A",
  state: "Selangor",
  stateId: 10,
  lat: 3.0,
  lon: 101.5,
  ipu: 150,
  pollutant: "PM2.5",
  time: "2026-10-16T21:00",
  ...over,
});

describe("stationBiases", () => {
  it("bias = PM2.5 setara rasmi − purata 24 jam model; bacaan lapuk atau tiada model diabaikan", () => {
    const stations = [
      station({ id: "A" }),
      station({ id: "B", time: "2026-10-16T16:00" }), // 5 jam lalu
      station({ id: "C", ipu: null, time: null }),
      station({ id: "D" }), // tiada model
    ];
    const biases = stationBiases(
      stations,
      { A: series(40), B: series(40), C: series(40) },
      NOW_KEY,
    );
    expect(biases.map((b) => b.id)).toEqual(["A"]);
    expect(biases[0].biasPm25).toBeCloseTo(ipuToPm25(150) - 40, 5);
    expect(biases[0].time).toBe("2026-10-16T21:00");
  });
});

describe("idwBias", () => {
  const bias = (
    id: string,
    lat: number,
    lon: number,
    value: number,
  ): StationBias => ({
    id,
    name: `Stesen ${id}`,
    lat,
    lon,
    time: "2026-10-16T21:00",
    biasPm25: value,
  });

  it("stesen lebih dekat lebih berpengaruh (1/d²)", () => {
    // P di 3.0,101.5; A ~11 km (bias 60), B ~55 km (bias 0).
    const result = idwBias({ lat: 3.0, lon: 101.5 }, [
      bias("A", 3.1, 101.5, 60),
      bias("B", 3.5, 101.5, 0),
    ]);
    expect(result).not.toBeNull();
    expect(result!.biasPm25).toBeGreaterThan(50);
    expect(result!.nearestName).toBe("Stesen A");
    expect(result!.stations).toBe(2);
  });

  it("dipudarkan mengikut jarak dan tiada bila semua stesen > 150 km", () => {
    const far = idwBias({ lat: 3.0, lon: 101.5 }, [bias("A", 4.0, 101.5, 60)]); // ~111 km
    expect(far!.biasPm25).toBeCloseTo(60 * (1 - 111.2 / 200), 0);
    expect(
      idwBias({ lat: 3.0, lon: 101.5 }, [bias("A", 5.0, 101.5, 60)]),
    ).toBeNull();
  });

  it("boleh mengecualikan stesen (ujian tinggal-satu-keluar)", () => {
    const biases = [bias("A", 3.0, 101.5, 60), bias("B", 3.2, 101.5, 10)];
    expect(idwBias({ lat: 3.0, lon: 101.5 }, biases, "A")!.nearestName).toBe(
      "Stesen B",
    );
  });
});

describe("applySpatialBias", () => {
  it("penuh hingga jam bias, reput 168 jam selepasnya, lantai 30% model", () => {
    const s = series(40);
    const up = applySpatialBias(s, { biasPm25: 60, time: "2026-10-16T00:00" });
    const at = (t: string) => up.pm25[s.times.indexOf(t)];
    expect(at("2026-10-15T12:00")).toBe(100);
    expect(at("2026-10-16T00:00")).toBe(100);
    expect(at("2026-10-16T18:00")).toBeCloseTo(
      40 + 60 * (1 - 18 / SPATIAL_DECAY_HOURS),
      5,
    );
    const down = applySpatialBias(s, {
      biasPm25: -100,
      time: "2026-10-16T00:00",
    });
    expect(down.pm25[0]).toBe(12);
  });
});
