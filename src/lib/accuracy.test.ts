import { describe, expect, it } from "vitest";
import {
  estimateErrors,
  estimateHours,
  forecastErrors,
  forecastHours,
  mergeAccuracy,
  shownError,
  spatialEstimateErrors,
  summarizeAccuracy,
  type AccuracyIndex,
} from "./accuracy";
import { addDays } from "./history";
import { ipuToPm25 } from "./ipu";

const NOW = new Date("2026-10-12T12:00:00Z");
const hours = (v: number | null) => Array.from({ length: 24 }, () => v);

/** Siri model 3 hari (11–13 Okt) dengan PM2.5 setara IPU tetap. */
const series = (ipu: number) => {
  const times = Array.from({ length: 72 }, (_, i) => {
    const d = addDays("2026-10-11", Math.floor(i / 24));
    return `${d}T${String(i % 24).padStart(2, "0")}:00`;
  });
  return { times, pm25: times.map(() => ipuToPm25(ipu)) };
};

describe("estimateHours dan estimateErrors", () => {
  it("menggunakan purata 24 jam dan membandingkan dengan rasmi", () => {
    const est = estimateHours(series(70), "2026-10-12");
    expect(est.every((v) => v === 70)).toBe(true);
    const errors = estimateErrors(
      { A: est, B: est },
      { date: "2026-10-12", stations: { A: hours(100), B: hours(null) } },
    );
    expect(errors).toEqual({ A: [30 * 24, 24] });
  });
});

describe("forecastHours dan forecastErrors", () => {
  it("ramalan dibetulkan lebih dekat dengan bacaan sebenar", () => {
    const history = Array.from({ length: 6 }, (_, i) => ({
      time: `2026-10-12T${String(15 + i).padStart(2, "0")}:00`,
      ipu: 150,
    }));
    const f = forecastHours(
      series(70),
      history,
      "2026-10-12T20:00",
      "2026-10-13",
    );
    expect(f.raw[8]).toBe(70);
    expect(f.corrected[8]!).toBeGreaterThan(120);
    const errors = forecastErrors(
      { date: "2026-10-13", madeAt: "", stations: { A: f } },
      { date: "2026-10-13", stations: { A: hours(150) } },
    );
    expect(errors.A.fr[0] / errors.A.fr[1]).toBe(80);
    expect(errors.A.fc[0] / errors.A.fc[1]).toBeLessThan(40);
  });

  it("model E (unit JAS) disimpan dan dinilai dalam mod bayang (v0.8.3)", () => {
    const history = Array.from({ length: 6 }, (_, i) => ({
      time: `2026-10-12T${String(15 + i).padStart(2, "0")}:00`,
      ipu: 150,
    }));
    const f = forecastHours(
      series(70),
      history,
      "2026-10-12T20:00",
      "2026-10-13",
    );
    // Bermula hampir pada bacaan rasmi dan berubah perlahan (purata 24 jam).
    expect(f.jas[0]!).toBeGreaterThan(140);
    expect(f.jas[8]!).toBeGreaterThan(f.raw[8]!);
    const errors = forecastErrors(
      { date: "2026-10-13", madeAt: "", stations: { A: f } },
      { date: "2026-10-13", stations: { A: hours(150) } },
    );
    expect(errors.A.fj![0] / errors.A.fj![1]).toBeLessThan(
      errors.A.fr[0] / errors.A.fr[1],
    );
  });

  it("snapshot lama tanpa model E masih dinilai", () => {
    const old = { raw: hours(70), corrected: hours(140) };
    const errors = forecastErrors(
      { date: "2026-10-13", madeAt: "", stations: { A: old } },
      { date: "2026-10-13", stations: { A: hours(150) } },
    );
    expect(errors.A.fj).toBeUndefined();
    expect(errors.A.fc[0] / errors.A.fc[1]).toBe(10);
  });
});

describe("summarizeAccuracy", () => {
  let index: AccuracyIndex | null = null;
  // 5 hari lepas: stesen A ralat anggaran 10, ramalan asal 40, dibetulkan 15, model E 8; B ralat 30.
  for (let back = 1; back <= 5; back++) {
    index = mergeAccuracy(
      index,
      addDays("2026-10-12", -back),
      {
        A: {
          e: [240, 24],
          es: [144, 24],
          fr: [960, 24],
          fc: [360, 24],
          fj: [192, 24],
        },
        B: { e: [720, 24] },
      },
      NOW,
    );
  }
  // Hari ini (tidak lengkap) tidak dikira.
  index = mergeAccuracy(index, "2026-10-12", { A: { e: [9999, 1] } }, NOW);

  it("nilai stesen bila cukup hari", () => {
    expect(summarizeAccuracy(index, "2026-10-12", "A")).toEqual({
      estimate: 10,
      estimateSpatial: 6,
      forecast: 15,
      forecastRaw: 40,
      forecastJas: 8,
      days: 5,
      jasDays: 5,
      scope: "station",
    });
  });

  it("ramalan kebangsaan bila stesen tiada data ramalan", () => {
    expect(summarizeAccuracy(index, "2026-10-12", "B")).toMatchObject({
      estimate: 30,
      forecast: 15,
      scope: "station",
    });
  });

  it("nilai kebangsaan bila stesen tiada data", () => {
    expect(summarizeAccuracy(index, "2026-10-12", "TIADA")).toEqual({
      estimate: 20,
      estimateSpatial: 6,
      forecast: 15,
      forecastRaw: 40,
      forecastJas: 8,
      days: 5,
      jasDays: 5,
      scope: "national",
    });
    expect(summarizeAccuracy(null, "2026-10-12")).toMatchObject({
      estimate: null,
      forecast: null,
      days: 0,
    });
  });

  it("±N ramalan hanya dipaparkan selepas 3 hari", () => {
    const s = summarizeAccuracy(index, "2026-10-12", "A");
    expect(shownError(s, "forecast")).toBe(15);
    expect(shownError({ ...s, days: 2 }, "forecast")).toBeNull();
    expect(shownError({ ...s, days: 0 }, "estimate")).toBe(10);
    expect(shownError(null, "estimate")).toBeNull();
  });

  it("membuang hari lebih lama daripada 120 hari", () => {
    const old = mergeAccuracy(
      { updatedAt: "", days: { "2026-01-01": { A: { e: [1, 1] } } } },
      "2026-10-12",
      {},
      NOW,
    );
    expect(old.days["2026-01-01"]).toBeUndefined();
  });
});

describe("spatialEstimateErrors (IDW tinggal-satu-keluar, v0.8.5)", () => {
  it("menganggar stesen tersembunyi daripada bias stesen lain", () => {
    const stations = [
      { id: "A", name: "A", lat: 3.0, lon: 101.5 },
      { id: "B", name: "B", lat: 3.1, lon: 101.6 },
      { id: "C", name: "C", lat: 3.2, lon: 101.5 },
      { id: "JAUH", name: "Jauh", lat: 6.0, lon: 116.0 },
    ];
    // Model malar 70 IPU di semua stesen; rasmi 150 di semua (bias sama).
    const model = series(70);
    const errors = spatialEstimateErrors(
      stations,
      stations.map(() => model),
      {
        date: "2026-10-12",
        stations: {
          A: hours(150),
          B: hours(150),
          C: hours(150),
          JAUH: hours(150),
        },
      },
      "2026-10-12",
    );
    expect(errors.A[1]).toBe(24);
    // Model mentah tersasar 80; bias IDW (dipudar ikut jarak ~15 km) menghampiri rasmi.
    expect(errors.A[0] / errors.A[1]).toBeLessThan(10);
    // Tiada stesen lain dalam 150 km: tiada anggaran.
    expect(errors.JAUH).toBeUndefined();
  });
});
