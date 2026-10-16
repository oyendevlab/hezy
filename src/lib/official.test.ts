import { describe, expect, it } from "vitest";
import type { Station } from "./apims";
import {
  dayIpu,
  displayIpu,
  officialFor,
  primaryReading,
  withOfficialHistory,
} from "./official";
import type { Reading } from "./reading";

const shahAlam: Station = {
  id: "CA20B",
  name: "Shah Alam",
  state: "Selangor",
  stateId: 10,
  lat: 3.104,
  lon: 101.556,
  ipu: 156,
  pollutant: "PM2.5",
  time: "2026-10-11T22:00",
};

describe("officialFor", () => {
  it("memulangkan bacaan rasmi stesen terdekat", () => {
    expect(
      officialFor([shahAlam], { lat: 3.07, lon: 101.52 }, "2026-10-11T23:00"),
    ).toMatchObject({
      stationName: "Shah Alam",
      ipu: 156,
      category: "tidak-sihat",
      label: "Tidak Sihat",
      pollutant: "PM2.5",
    });
  });

  it("mengabaikan bacaan yang lebih lama daripada 3 jam", () => {
    expect(
      officialFor([shahAlam], { lat: 3.07, lon: 101.52 }, "2026-10-12T02:00"),
    ).toBeNull();
  });

  it("mengabaikan stesen yang terlalu jauh", () => {
    expect(
      officialFor([shahAlam], { lat: 4.6, lon: 101.08 }, "2026-10-11T23:00"),
    ).toBeNull();
  });
});

describe("primaryReading", () => {
  const current = {
    time: "2026-10-11T23:00",
    ipu: 65,
    category: "sederhana" as const,
    label: "Sederhana",
    emergency: false,
    pm25Average: 30,
  };

  it("mengutamakan bacaan rasmi", () => {
    const official = officialFor(
      [shahAlam],
      { lat: 3.07, lon: 101.52 },
      "2026-10-11T23:00",
    );
    expect(primaryReading({ current, official })).toMatchObject({
      ipu: 156,
      source: "apims",
    });
  });

  it("menggunakan anggaran model bila tiada bacaan rasmi", () => {
    expect(primaryReading({ current, official: null })).toMatchObject({
      ipu: 65,
      source: "model",
    });
    expect(primaryReading(undefined)).toBeNull();
  });
});

describe("withOfficialHistory", () => {
  const reading = {
    today: [
      { time: "2026-10-12T07:00", ipu: 60, hourlyIpu: 58, forecast: false },
      { time: "2026-10-12T08:00", ipu: 61, hourlyIpu: 62, forecast: false },
      { time: "2026-10-12T09:00", ipu: 62, hourlyIpu: 70, forecast: true },
    ],
  } as unknown as Reading;

  it("melampirkan IPU rasmi pada jam lepas sahaja", () => {
    const merged = withOfficialHistory(reading, [
      { time: "2026-10-12T07:00", ipu: 74 },
      { time: "2026-10-12T09:00", ipu: 99 },
    ]);
    expect(merged.today.map((h) => h.officialIpu)).toEqual([
      74,
      null,
      undefined,
    ]);
    expect(merged.today.map(displayIpu)).toEqual([74, 62, 70]);
  });
});

describe("dayIpu (ringkasan harian unit JAS, v0.8.3)", () => {
  const base = { ipu: 80, hourlyIpu: 120 };
  it("rasmi bagi jam lepas, model E bagi jam belum diterbitkan", () => {
    expect(dayIpu({ ...base, forecast: false, officialIpu: 150 })).toBe(150);
    expect(dayIpu({ ...base, forecast: true, jasIpu: 148 })).toBe(148);
    // Jam semasa: APIMS belum terbit, model E sudah ada.
    expect(
      dayIpu({ ...base, forecast: false, officialIpu: null, jasIpu: 149 }),
    ).toBe(149);
  });

  it("bacaan lama tanpa jasIpu: IPU sejam untuk ramalan, purata 24 jam model untuk jam lepas", () => {
    expect(dayIpu({ ...base, forecast: true })).toBe(120);
    expect(dayIpu({ ...base, forecast: false })).toBe(80);
  });
});
