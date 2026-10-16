import { describe, expect, it } from "vitest";
import { JAS_DECAY_HOURS, jasAnchor, jasForecast } from "./forecast-jas";
import { pm25ToIpu } from "./ipu";

/** Siri sejam bermula 14 Okt 2026 00:00 waktu Malaysia. */
function series(hours: number, pm25: (h: number) => number | null) {
  const times = Array.from({ length: hours }, (_, h) => {
    const date = new Date(Date.UTC(2026, 9, 14, h));
    return date.toISOString().slice(0, 13) + ":00";
  });
  return { times, pm25: times.map((_, h) => pm25(h)) };
}

const at = (times: string[], time: string) => times.indexOf(time);
// Bacaan rasmi 150 dari 8 pagi hingga 12 tengah hari, 16 Okt (model malar 40 µg/m³ ≈ IPU 73).
const HISTORY = [8, 9, 10, 11, 12].map((h) => ({
  time: `2026-10-16T${String(h).padStart(2, "0")}:00`,
  ipu: 150,
}));
const NOW_KEY = "2026-10-16T13:00";

describe("jasAnchor", () => {
  it("mengambil bacaan rasmi terakhir dan offset supaya purata 24 jam sama", () => {
    const { times, pm25 } = series(120, () => 40);
    expect(jasAnchor(times, pm25, HISTORY, NOW_KEY)).toEqual({
      time: "2026-10-16T12:00",
      ipu: 150,
      offsetPm25: 72.6,
    });
  });

  it("tiada asas tanpa sejarah, bacaan lapuk (> 3 jam) atau jam masa depan", () => {
    const { times, pm25 } = series(120, () => 40);
    expect(jasAnchor(times, pm25, [], NOW_KEY)).toBeNull();
    expect(jasAnchor(times, pm25, HISTORY, "2026-10-16T16:00")).toBeNull();
    expect(
      jasAnchor(times, pm25, [{ time: "2026-10-16T14:00", ipu: 90 }], NOW_KEY),
    ).toBeNull();
  });
});

describe("jasForecast (model E)", () => {
  it("bermula tepat pada IPU rasmi dan berubah perlahan selepasnya", () => {
    const { times, pm25 } = series(168, () => 40);
    const { anchor, ipu } = jasForecast(times, pm25, HISTORY, NOW_KEY);
    const i = at(times, "2026-10-16T12:00");
    expect(anchor?.ipu).toBe(150);
    expect(ipu[i]).toBe(150);
    // IPU rasmi ialah purata 24 jam: tiada lompatan besar jam demi jam.
    for (let k = i + 1; k <= i + 12; k++) {
      expect(
        Math.abs((ipu[k] as number) - (ipu[k - 1] as number)),
      ).toBeLessThanOrEqual(5);
    }
    expect(ipu[i + 1]).toBeGreaterThan(145);
  });

  it("kembali kepada model selepas offset reput (168 jam + tetingkap 24 jam)", () => {
    const { times, pm25 } = series(300, () => 40);
    const { ipu } = jasForecast(times, pm25, HISTORY, NOW_KEY);
    const i = at(times, "2026-10-16T12:00");
    expect(ipu[i + JAS_DECAY_HOURS + 24]).toBe(pm25ToIpu(40));
  });

  it("pembetulan masih bertahan pada hari ke-3 hingga ke-5 (v0.8.8)", () => {
    const { times, pm25 } = series(300, () => 40);
    const { ipu } = jasForecast(times, pm25, HISTORY, NOW_KEY);
    const i = at(times, "2026-10-16T12:00");
    // Asas 150, model mentah ~73: pada 72 jam masih hampir separuh jalan, bukan model mentah.
    expect(ipu[i + 72]).toBeGreaterThan(110);
    expect(ipu[i + 120]).toBeGreaterThan(90);
    expect(ipu[i + 120]).toBeLessThan(ipu[i + 72] as number);
  });

  it("tanpa bacaan rasmi: purata 24 jam model mentah", () => {
    const { times, pm25 } = series(120, () => 40);
    const { anchor, ipu } = jasForecast(times, pm25, [], NOW_KEY);
    expect(anchor).toBeNull();
    expect(ipu[10]).toBeNull(); // kurang 18 jam data
    expect(ipu[60]).toBe(pm25ToIpu(40));
  });

  it("offset negatif: model tidak jatuh di bawah 30% dan ramalan awal ikut bacaan rasmi", () => {
    const { times, pm25 } = series(120, () => 40);
    const history = [{ time: "2026-10-16T12:00", ipu: 20 }];
    const { ipu } = jasForecast(times, pm25, history, NOW_KEY);
    const i = at(times, "2026-10-16T12:00");
    expect(ipu.slice(i).every((v) => v === null || v >= 20)).toBe(true);
    expect(ipu[i + 1]).toBeLessThan(30);
  });

  it("lonjakan model 3 jam diratakan seperti IPU rasmi (purata 24 jam)", () => {
    const spike = (h: number) => (h >= 84 && h < 87 ? 300 : 40);
    const { times, pm25 } = series(120, spike);
    const { ipu } = jasForecast(times, pm25, [], NOW_KEY);
    expect(pm25ToIpu(300)).toBe(350);
    expect(
      Math.max(...(ipu.filter((v) => v !== null) as number[])),
    ).toBeLessThan(110);
  });
});
