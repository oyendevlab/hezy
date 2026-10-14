import { describe, expect, it } from "vitest";
import { HEADLINES, pickHeadline, recentChange, timeOfDay } from "./headline";
import { translate } from "./i18n";

const base = {
  category: "tidak-sihat" as const,
  hour: 15,
  seed: "2026-10-14:putrajaya",
};

describe("pickHeadline", () => {
  it("keutamaan: profil → arah IPU → hujan → waktu", () => {
    expect(pickHeadline({ ...base, profile: "anak", change: 20 })).toBe(
      "Anak elok bermain di dalam rumah hari ini.",
    );
    expect(pickHeadline({ ...base, change: 20, raining: true })).toBe(
      "Jerebu semakin teruk. Hadkan masa di luar.",
    );
    expect(pickHeadline({ ...base, change: -12 })).toBe(
      "Udara beransur pulih, tetapi hadkan aktiviti luar dahulu.",
    );
    expect(pickHeadline({ ...base, change: 5, raining: true })).toBe(
      "Hujan membantu, tetapi udara masih tidak sihat.",
    );
    expect(HEADLINES["tidak-sihat"].malam).toContain(
      pickHeadline({ ...base, hour: 22 }),
    );
  });

  it("stabil bagi seed yang sama; keadaan tanpa ayat jatuh ke waktu", () => {
    const a = pickHeadline({ ...base, hour: 8 });
    expect(pickHeadline({ ...base, hour: 9 })).toBe(a);
    // Baik tiada ayat profil: guna ayat waktu.
    expect(HEADLINES.baik.pagi).toContain(
      pickHeadline({ category: "baik", profile: "asma", hour: 8, seed: "x" }),
    );
  });

  it("tiada lagi 'bersenam'; setiap ayat ada terjemahan EN", () => {
    for (const table of Object.values(HEADLINES))
      for (const list of Object.values(table))
        for (const text of list!) {
          expect(text).not.toMatch(/bersenam/i);
          expect(translate("en", text)).not.toBe(text);
        }
  });

  it("waktu: pagi 5–10, petang 11–18, malam selainnya", () => {
    expect([4, 5, 10, 11, 18, 19].map(timeOfDay)).toEqual([
      "malam",
      "pagi",
      "pagi",
      "petang",
      "petang",
      "malam",
    ]);
  });
});

describe("recentChange", () => {
  const h = (hour: number, v: number, forecast = false, official?: number) => ({
    time: `2026-10-14T${String(hour).padStart(2, "0")}:00`,
    forecast,
    hourlyIpu: v,
    officialIpu: official ?? null,
  });

  it("jam terkini berbanding 3 jam sebelumnya, rasmi diutamakan", () => {
    expect(recentChange([h(9, 80), h(12, 100), h(13, 150, true)])).toBe(20);
    expect(recentChange([h(9, 80, false, 90), h(12, 70, false, 120)])).toBe(30);
    expect(recentChange([h(11, 80), h(12, 100)])).toBeNull();
  });
});
