import { describe, expect, it } from "vitest";
import {
  MET_STATES,
  metCondition,
  metDayFor,
  metFor,
  metTargetFor,
  parseForecasts,
  parseMetBundle,
  parseWarnings,
  pickForecasts,
  warningSegments,
  type MetTarget,
} from "./metmalaysia";

/** Sasaran peringkat negeri sahaja (seperti sebelum v0.8.11). */
const stateTarget = (state: string): MetTarget => ({
  state,
  sources: [
    { id: MET_STATES[state]?.forecastId ?? "-", kind: "state", name: state },
  ],
});

// Format sebenar api.data.gov.my (16 Okt 2026), dipendekkan.
const THUNDER_MS =
  "Ribut petir, hujan lebat dan angin kencang dijangka di negeri Perak (Selama, Kerian dan Manjung) • Selangor (Hulu Langat, Gombak dan Sabak Bernam) • W.P. Kuala Lumpur • Negeri Sembilan (Jelebu dan Seremban) • Sarawak: Limbang, Miri, Kapit (Song dan Kapit) • W.P. Labuan sehingga 12:00 Tengah Malam; Sabtu, 17 Oktober 2026.";
const THUNDER_EN =
  "Thunderstorms, heavy rain and strong winds are expected over the states of Perak (Selama, Kerian and Manjung) • Selangor (Hulu Langat, Gombak and Sabak Bernam) • W.P. Kuala Lumpur • Negeri Sembilan (Jelebu and Seremban) • Sarawak: Limbang, Miri, Kapit (Song and Kapit) • W.P. Labuan until 12:00 AM; Saturday, 17 October 2026.";

const WARNINGS_JSON = [
  {
    warning_issue: {
      issued: "2026-10-16T22:30:00",
      title_bm: "Tiada Nasihat",
      title_en: "No Advisory",
    },
    valid_from: null,
    valid_to: null,
    text_bm: "Tiada sistem Siklon Tropika dicerap.",
    text_en: "No Tropical Cyclone system is observed.",
  },
  {
    warning_issue: {
      issued: "2026-10-16T21:00:00",
      title_bm: "Amaran Angin Kencang dan Laut Bergelora",
      title_en: "Strong Winds and Rough Seas Warning",
    },
    valid_from: "2026-10-16T21:00:00",
    valid_to: "2026-10-17T01:00:00",
    text_bm: "Ribut petir dijangka di kawasan perairan Selangor • Johor Barat.",
    text_en:
      "Thunderstorms are expected over the waters of Selangor • West Johor.",
  },
  {
    warning_issue: {
      issued: "2026-10-16T20:55:00",
      title_bm: "Amaran Ribut Petir",
      title_en: "Thunderstorms Warning",
    },
    valid_from: "2026-10-16T21:00:00",
    valid_to: "2026-10-17T00:00:00",
    text_bm: THUNDER_MS,
    text_en: THUNDER_EN,
  },
  { rosak: true },
];

describe("parseWarnings", () => {
  it("membaca medan dan mengabaikan baris rosak", () => {
    const warnings = parseWarnings(WARNINGS_JSON);
    expect(warnings).toHaveLength(3);
    expect(warnings[2]).toMatchObject({
      titleMs: "Amaran Ribut Petir",
      titleEn: "Thunderstorms Warning",
      issued: "2026-10-16T20:55",
      validTo: "2026-10-17T00:00",
    });
    expect(() => parseWarnings({ data: [] })).toThrow();
  });
});

describe("warningSegments", () => {
  it("memecah senarai negeri dan membuang ekor 'sehingga …'", () => {
    const segments = warningSegments(THUNDER_MS);
    expect(segments[0]).toBe("Perak (Selama, Kerian dan Manjung)");
    expect(segments[2]).toBe("W.P. Kuala Lumpur");
    expect(segments.at(-1)).toBe("W.P. Labuan");
    expect(warningSegments(THUNDER_EN).length).toBe(segments.length);
  });
});

describe("metFor", () => {
  const warnings = parseWarnings(WARNINGS_JSON);
  const forecasts = parseForecasts([
    {
      location: { location_id: "St008", location_name: "Selangor" },
      date: "2026-10-17",
      morning_forecast: "Jerebu",
      afternoon_forecast: "Ribut petir di beberapa tempat",
      night_forecast: "Tiada Hujan",
      summary_forecast: "Ribut petir di beberapa tempat",
      summary_when: "Petang",
      min_temp: 24,
      max_temp: 33,
    },
    {
      location: { location_id: "St008", location_name: "Selangor" },
      date: "2026-10-15",
      morning_forecast: "Tiada Hujan",
      afternoon_forecast: "Tiada Hujan",
      night_forecast: "Tiada Hujan",
      summary_forecast: "Tiada Hujan",
      summary_when: "Sepanjang Hari",
      min_temp: 24,
      max_temp: 32,
    },
  ]);

  it("amaran darat bagi negeri dengan daerahnya; amaran laut diabaikan", () => {
    const met = metFor(
      stateTarget("selangor"),
      warnings,
      forecasts,
      "2026-10-16T22:00",
    );
    expect(met?.warnings).toHaveLength(1);
    expect(met?.warnings[0]).toMatchObject({
      title: { ms: "Amaran Ribut Petir", en: "Thunderstorms Warning" },
      validTo: "2026-10-17T00:00",
      area: {
        ms: "Selangor (Hulu Langat, Gombak dan Sabak Bernam)",
        en: "Selangor (Hulu Langat, Gombak and Sabak Bernam)",
      },
    });
  });

  it("Wilayah dan Sarawak dipadankan; negeri tidak disebut tiada amaran", () => {
    expect(
      metFor(
        stateTarget("kuala-lumpur"),
        warnings,
        forecasts,
        "2026-10-16T22:00",
      )?.warnings[0].area.ms,
    ).toBe("W.P. Kuala Lumpur");
    expect(
      metFor(stateTarget("sarawak"), warnings, forecasts, "2026-10-16T22:00")
        ?.warnings[0].area.ms,
    ).toBe("Sarawak: Limbang, Miri, Kapit (Song dan Kapit)");
    expect(
      metFor(stateTarget("johor"), warnings, forecasts, "2026-10-16T22:00")
        ?.warnings,
    ).toEqual([]);
  });

  it("amaran tamat tidak dipaparkan; ramalan hari ini ke hadapan sahaja", () => {
    const met = metFor(
      stateTarget("selangor"),
      warnings,
      forecasts,
      "2026-10-17T00:30",
    );
    expect(met?.warnings).toEqual([]);
    expect(met?.forecast.map((d) => d.date)).toEqual(["2026-10-17"]);
    expect(met?.forecast[0]).toMatchObject({
      min: 24,
      max: 33,
      when: "Petang",
    });
    expect(met?.area).toEqual({ kind: "state", name: "selangor" });
    expect(
      metFor(stateTarget("tiada"), warnings, forecasts, "2026-10-17T00:30"),
    ).toBeNull();
  });
});

describe("metCondition (v0.8.9)", () => {
  it("memecah frasa kepada jenis, label pendek dan kelayakan", () => {
    expect(
      metCondition("Ribut petir di kebanyakan tempat di kawasan pedalaman"),
    ).toEqual({
      kind: "storm",
      main: "Ribut petir",
      qualifiers: ["kebanyakan tempat", "pedalaman"],
    });
    expect(metCondition("Hujan di beberapa tempat")).toEqual({
      kind: "rain",
      main: "Hujan",
      qualifiers: ["beberapa tempat"],
    });
    expect(metCondition("Ribut petir menyeluruh")).toMatchObject({
      kind: "storm",
      qualifiers: ["menyeluruh"],
    });
    expect(metCondition("Tiada Hujan")).toEqual({
      kind: "dry",
      main: "Tiada hujan",
      qualifiers: [],
    });
    expect(metCondition("Jerebu")).toEqual({
      kind: "haze",
      main: "Jerebu",
      qualifiers: [],
    });
    expect(metCondition("Berangin")).toEqual({
      kind: "other",
      main: "Berangin",
      qualifiers: [],
    });
  });

  it("metDayFor mencari hari ikut tarikh", () => {
    const days = parseForecasts([
      {
        location: { location_id: "St010" },
        date: "2026-10-18",
        summary_forecast: "Jerebu",
        min_temp: 25,
        max_temp: 33,
      },
    ]).St010;
    expect(metDayFor(days, "2026-10-18")?.max).toBe(33);
    expect(metDayFor(days, "2026-10-19")).toBeUndefined();
    expect(metDayFor(undefined, "2026-10-18")).toBeUndefined();
  });
});

describe("lokasi ramalan (v0.8.11)", () => {
  const day = (date: string, max: number) => ({
    date,
    morning: "Tiada Hujan",
    afternoon: "Ribut petir",
    night: "Tiada Hujan",
    summary: "Ribut petir",
    when: "Petang",
    min: max - 8,
    max,
  });

  it("tanah tinggi, kemudian daerah, kemudian negeri", () => {
    const genting = metTargetFor(
      { lat: 3.42, lon: 101.79 },
      { district: "Bentong", state: "pahang", met: "Ds059" },
      "Pahang",
    );
    expect(genting?.sources.map((s) => [s.id, s.kind])).toEqual([
      ["Rc016", "zone"],
      ["Ds059", "district"],
      ["St007", "state"],
    ]);
    const cameron = metTargetFor(
      { lat: 4.47, lon: 101.38 },
      { district: "Cameron Highlands", state: "pahang", met: "Ds038" },
      "Pahang",
    );
    expect(cameron?.sources.map((s) => s.id)).toEqual(["Ds038", "St007"]);
    expect(
      metTargetFor(
        { lat: 3, lon: 101 },
        { district: "x", state: "atlantis", met: null },
        "x",
      ),
    ).toBeNull();
  });

  it("metFor guna lokasi pertama yang ada data", () => {
    const target = metTargetFor(
      { lat: 4.47, lon: 101.38 },
      { district: "Cameron Highlands", state: "pahang", met: "Ds038" },
      "Pahang",
    )!;
    const forecasts = {
      Ds038: [day("2026-10-18", 24)],
      St007: [day("2026-10-18", 34)],
    };
    const met = metFor(target, [], forecasts, "2026-10-18T08:00");
    expect(met?.area).toEqual({ kind: "district", name: "Cameron Highlands" });
    expect(met?.forecast[0].max).toBe(24);
    const fallback = metFor(
      target,
      [],
      { St007: forecasts.St007 },
      "2026-10-18T08:00",
    );
    expect(fallback?.area).toEqual({ kind: "state", name: "Pahang" });
    expect(metFor(target, [], {}, "2026-10-18T08:00")?.forecast).toEqual([]);
  });

  it("pickForecasts menyimpan lokasi yang digunakan dari hari ini sahaja", () => {
    const picked = pickForecasts(
      {
        St007: [day("2026-10-17", 33), day("2026-10-18", 34)],
        Ds038: [day("2026-10-18", 24)],
        Rc016: [day("2026-10-18", 25)],
        Rc001: [day("2026-10-18", 32)],
        Tn141: [day("2026-10-18", 30)],
        Tn001: [day("2026-10-18", 32)],
        Dv501: [day("2026-10-18", 32)],
        St001: [day("2026-10-16", 32)],
      },
      "2026-10-18",
    );
    expect(Object.keys(picked).sort()).toEqual([
      "Ds038",
      "Rc016",
      "St007",
      "Tn141",
    ]);
    expect(picked.St007.map((d) => d.date)).toEqual(["2026-10-18"]);
  });

  it("parseMetBundle menolak bentuk lain", () => {
    expect(
      parseMetBundle({ warnings: [], forecasts: {}, fetchedAt: "x" }),
    ).toEqual({ warnings: [], forecasts: {}, fetchedAt: "x" });
    expect(() => parseMetBundle({ error: "x" })).toThrow();
    expect(() => parseMetBundle(null)).toThrow();
  });
});
