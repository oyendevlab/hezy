import { describe, expect, it } from "vitest";
import {
  applyCorrection,
  computeCorrection,
  type Correction,
} from "./forecast-correction";
import { ipuToPm25, pm25ToIpu } from "./ipu";
import { buildReading } from "./reading";

// Data sebenar Putrajaya, 12 Okt 2026 (APIMS CA17W dan model Open-Meteo/CAMS).
const OFFICIAL = [88, 90, 91, 94, 96, 99, 110, 133, 146, 148, 151, 152, 153];
const MODEL_IPU = [
  67, 70, 71, 65, 60, 59, 58, 59, 61, 65, 67, 68, 70, 73, 75, 74, 73, 72, 74,
  89, 114, 121, 96, 87,
];
const time = (h: number) =>
  h < 24
    ? `2026-10-12T${String(h).padStart(2, "0")}:00`
    : `2026-10-13T${String(h - 24).padStart(2, "0")}:00`;
// 48 jam: hari ini + esok (esok mengulang corak model hari ini).
const TIMES = Array.from({ length: 48 }, (_, h) => time(h));
const PM25 = Array.from({ length: 48 }, (_, h) => ipuToPm25(MODEL_IPU[h % 24]));
const HISTORY = OFFICIAL.map((ipu, h) => ({ time: time(h), ipu }));
const NOW_KEY = "2026-10-12T12:00";
// 12:20 waktu Malaysia.
const NOW = new Date("2026-10-12T04:20:00Z");

describe("ipuToPm25", () => {
  it("ialah songsangan pm25ToIpu", () => {
    for (const ipu of [0, 25, 50, 51, 75, 100, 101, 153, 200, 250, 350, 450]) {
      expect(pm25ToIpu(ipuToPm25(ipu))).toBe(ipu);
    }
  });
});

describe("computeCorrection", () => {
  it("mengira offset median 6 jam terakhir (data 12 Okt)", () => {
    const c = computeCorrection(TIMES, PM25, HISTORY, NOW_KEY)!;
    expect(c.matchedHours).toBe(6);
    expect(c.anchorTime).toBe("2026-10-12T12:00");
    expect(c.anchorIpu).toBe(153);
    expect(c.offsetPm25).toBeCloseTo(80.3, 0);
  });

  it("tiada pembetulan tanpa sejarah, terlalu sedikit jam, atau bacaan lapuk", () => {
    expect(computeCorrection(TIMES, PM25, [], NOW_KEY)).toBeNull();
    expect(
      computeCorrection(TIMES, PM25, HISTORY.slice(12), NOW_KEY),
    ).toBeNull();
    expect(
      computeCorrection(TIMES, PM25, HISTORY.slice(0, 8), NOW_KEY),
    ).toBeNull();
  });
});

describe("applyCorrection", () => {
  const c = computeCorrection(TIMES, PM25, HISTORY, NOW_KEY) as Correction;
  const corrected = applyCorrection(TIMES, PM25, c).map((v) =>
    v === null ? null : pm25ToIpu(v),
  );

  it("tidak mengubah jam sebelum dan pada bacaan rasmi terakhir", () => {
    expect(corrected.slice(0, 13)).toEqual(
      PM25.slice(0, 13).map((v) => pm25ToIpu(v)),
    );
  });

  it("ramalan berterusan dari bacaan rasmi (tiada jatuh mendadak)", () => {
    // 1 ptg: model mentah 73, dibetulkan ~154.
    expect(corrected[13]).toBeGreaterThanOrEqual(145);
    expect(corrected[13]).toBeLessThanOrEqual(160);
    // Puncak malam model (121) dibetulkan tetapi tidak melampau.
    expect(corrected[21]).toBeGreaterThan(180);
    expect(corrected[21]).toBeLessThan(230);
  });

  it("pembetulan berkurang secara linear ke arah model", () => {
    // Jam terakhir siri: 35 jam selepas bacaan rasmi → baki offset 13/48.
    expect(ipuToPm25(corrected[47]!) - PM25[47]).toBeCloseTo(
      80.3 * (13 / 48),
      0,
    );
  });

  it("offset negatif tidak menjatuhkan ramalan di bawah separuh model", () => {
    const low = applyCorrection(TIMES, PM25, {
      ...c,
      offsetPm25: -150,
      anchorIpu: 20,
    });
    expect(low[30]!).toBeGreaterThanOrEqual(PM25[30] * 0.5 - 1e-9);
  });
});

describe("buildReading dengan sejarah rasmi", () => {
  const series = { times: TIMES, pm25: PM25 } as Parameters<
    typeof buildReading
  >[0];

  it("ramalan hari ini, masa terbaik dan ramalan harian dibetulkan", () => {
    const raw = buildReading(series, NOW);
    const fixed = buildReading(series, NOW, HISTORY);
    expect(raw.correction).toBeNull();
    expect(fixed.correction?.anchorIpu).toBe(153);
    const at13 = fixed.today.find((h) => h.time === "2026-10-12T13:00")!;
    expect(at13.corrected).toBe(true);
    expect(at13.hourlyIpu).toBeGreaterThan(140);
    expect(
      raw.today.find((h) => h.time === "2026-10-12T13:00")!.hourlyIpu,
    ).toBe(73);
    expect(fixed.bestWindow!.averageIpu).toBeGreaterThan(
      raw.bestWindow!.averageIpu,
    );
    // Jam sehingga bacaan rasmi terakhir tidak ditanda dibetulkan.
    expect(fixed.today[5].corrected).toBeUndefined();
    expect(fixed.today[12].corrected).toBeUndefined();
  });

  it("jam semasa tanpa bacaan rasmi turut dibetulkan", () => {
    // 1:20 ptg: APIMS belum menerbitkan bacaan jam 1 ptg.
    const fixed = buildReading(
      series,
      new Date("2026-10-12T05:20:00Z"),
      HISTORY,
    );
    const at13 = fixed.today.find((h) => h.time === "2026-10-12T13:00")!;
    expect(at13.forecast).toBe(false);
    expect(at13.corrected).toBe(true);
    expect(at13.hourlyIpu).toBeGreaterThan(140);
  });
});
