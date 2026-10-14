import { describe, expect, it } from "vitest";
import { mergeRecord, normalizeRecord, type PushRecord } from "./push-record";
import { parseSubscribeBody } from "./push-validate";

const subscription = {
  endpoint: "https://fcm.example/p/1",
  keys: { p256dh: "BAbc", auth: "xyz" },
};
const NOW = new Date("2026-10-12T02:00:00Z");

describe("parseSubscribeBody (berbilang lokasi)", () => {
  it("menerima senarai lokasi dan membuang id berganda", () => {
    const parsed = parseSubscribeBody({
      subscription,
      threshold: 50,
      locations: [
        { id: "area:shah-alam", name: "Shah Alam", lat: 3.0731, lon: 101.5183 },
        { id: "area:klang", name: "Klang", lat: 3.04, lon: 101.45 },
        { id: "area:klang", name: "Klang", lat: 3.04, lon: 101.45 },
      ],
    });
    expect(parsed).toMatchObject({
      ok: true,
      value: {
        threshold: 50,
        locations: [
          { id: "area:shah-alam", name: "Shah Alam", lat: 3.07, lon: 101.52 },
          { id: "area:klang", name: "Klang" },
        ],
      },
    });
    expect(parsed.ok && parsed.value.locations).toHaveLength(2);
  });

  it("masih menerima format lama dengan satu lokasi", () => {
    expect(
      parseSubscribeBody({
        subscription,
        lat: 3.07,
        lon: 101.52,
        locationName: "Shah Alam",
      }),
    ).toMatchObject({
      ok: true,
      value: { locations: [{ id: "semasa", name: "Shah Alam" }] },
    });
  });

  it("menolak lebih daripada 6 lokasi atau lokasi luar Malaysia", () => {
    const loc = (i: number) => ({ id: `l${i}`, name: "X", lat: 3, lon: 101 });
    expect(
      parseSubscribeBody({
        subscription,
        locations: [0, 1, 2, 3, 4, 5, 6].map(loc),
      }).ok,
    ).toBe(false);
    expect(
      parseSubscribeBody({
        subscription,
        locations: [{ id: "bkk", name: "Bangkok", lat: 13.7, lon: 100.5 }],
      }).ok,
    ).toBe(false);
  });
});

describe("normalizeRecord", () => {
  it("menukar rekod lama kepada senarai lokasi", () => {
    const legacy = {
      subscription,
      lat: 3.07,
      lon: 101.52,
      locationName: "Shah Alam",
      lastAlertKey: "tidak-sihat" as const,
      lastAlertAt: "2026-10-12T00:00:00Z",
      createdAt: "2026-10-11T00:00:00Z",
    };
    expect(normalizeRecord(legacy)).toEqual({
      subscription,
      threshold: 100,
      createdAt: "2026-10-11T00:00:00Z",
      locations: [
        {
          id: "semasa",
          name: "Shah Alam",
          lat: 3.07,
          lon: 101.52,
          lastAlertKey: "tidak-sihat",
          lastAlertAt: "2026-10-12T00:00:00Z",
        },
      ],
    });
  });
});

describe("mergeRecord", () => {
  const existing: PushRecord = {
    subscription,
    threshold: 100,
    createdAt: "2026-10-11T00:00:00Z",
    locations: [
      {
        id: "semasa",
        name: "Shah Alam",
        lat: 3.07,
        lon: 101.52,
        lastAlertKey: "tidak-sihat",
        lastAlertAt: "2026-10-12T01:00:00Z",
      },
    ],
  };

  it("mengekalkan status amaran bagi lokasi yang sama (ikut koordinat)", () => {
    const merged = mergeRecord(
      {
        subscription,
        threshold: 50,
        lang: "en",
        options: {
          morning: true,
          forecast: false,
          spike: false,
          expected: false,
          school: false,
          quiet: { start: 23, end: 6 },
        },
        locations: [
          { id: "area:shah-alam", name: "Shah Alam", lat: 3.07, lon: 101.52 },
          { id: "area:klang", name: "Klang", lat: 3.04, lon: 101.45 },
        ],
      },
      existing,
      NOW,
    );
    expect(merged.createdAt).toBe("2026-10-11T00:00:00Z");
    expect(merged.lang).toBe("en");
    expect(merged.options?.quiet).toEqual({ start: 23, end: 6 });
    expect(merged.locations.map((l) => l.lastAlertKey)).toEqual([
      "tidak-sihat",
      null,
    ]);
  });
});
