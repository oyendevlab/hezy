import { describe, expect, it } from "vitest";
import {
  estimateErrors,
  estimateHours,
  forecastErrors,
  forecastHours,
  mergeAccuracy,
  shownError,
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
});

describe("summarizeAccuracy", () => {
  let index: AccuracyIndex | null = null;
  // 5 hari lepas: stesen A ralat anggaran 10, ramalan asal 40 dan dibetulkan 15; B ralat 30.
  for (let back = 1; back <= 5; back++) {
    index = mergeAccuracy(
      index,
      addDays("2026-10-12", -back),
      {
        A: { e: [240, 24], fr: [960, 24], fc: [360, 24] },
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
      forecast: 15,
      forecastRaw: 40,
      days: 5,
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
      forecast: 15,
      forecastRaw: 40,
      days: 5,
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
