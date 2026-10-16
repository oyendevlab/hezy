import { describe, expect, it } from "vitest";
import {
  metFor,
  parseForecasts,
  parseWarnings,
  warningSegments,
} from "./metmalaysia";

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
    const met = metFor("selangor", warnings, forecasts, "2026-10-16T22:00");
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
      metFor("kuala-lumpur", warnings, forecasts, "2026-10-16T22:00")
        ?.warnings[0].area.ms,
    ).toBe("W.P. Kuala Lumpur");
    expect(
      metFor("sarawak", warnings, forecasts, "2026-10-16T22:00")?.warnings[0]
        .area.ms,
    ).toBe("Sarawak: Limbang, Miri, Kapit (Song dan Kapit)");
    expect(
      metFor("johor", warnings, forecasts, "2026-10-16T22:00")?.warnings,
    ).toEqual([]);
  });

  it("amaran tamat tidak dipaparkan; ramalan hari ini ke hadapan sahaja", () => {
    const met = metFor("selangor", warnings, forecasts, "2026-10-17T00:30");
    expect(met?.warnings).toEqual([]);
    expect(met?.forecast.map((d) => d.date)).toEqual(["2026-10-17"]);
    expect(met?.forecast[0]).toMatchObject({
      min: 24,
      max: 33,
      when: "Petang",
    });
    expect(metFor("tiada", warnings, forecasts, "2026-10-17T00:30")).toBeNull();
  });
});
