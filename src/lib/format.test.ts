import { describe, expect, it } from "vitest";
import {
  formatLongDate,
  formatStamp,
  formatShortDate,
  formatChange,
  formatClock,
  formatDay,
  formatHour,
  formatWindow,
} from "./format";

describe("formatHour", () => {
  it.each([
    ["2026-10-11T00:00", "12 AM"],
    ["2026-10-11T07:00", "7 AM"],
    ["2026-10-11T12:00", "12 PM"],
    ["2026-10-11T15:00", "3 PM"],
    ["2026-10-11T22:00", "10 PM"],
  ])("%s → %s", (time, label) => {
    expect(formatHour(time)).toBe(label);
  });

  it("formatClock memaparkan minit", () => {
    expect(formatClock("2026-10-11T10:00")).toBe("10:00 AM");
  });
});

describe("formatWindow", () => {
  it("menggabungkan julat dalam tempoh yang sama", () => {
    expect(
      formatWindow("2026-10-11T21:00", "2026-10-11T23:00", "2026-10-11"),
    ).toBe("9 – 11 PM");
  });

  it("memaparkan dua tempoh dan menanda esok", () => {
    expect(
      formatWindow("2026-10-12T05:00", "2026-10-12T07:00", "2026-10-11"),
    ).toBe("Esok, 5 – 7 AM");
    expect(
      formatWindow("2026-10-11T11:00", "2026-10-11T13:00", "2026-10-11"),
    ).toBe("11 AM – 1 PM");
  });
});

describe("formatChange", () => {
  it.each([
    [12, "Naik 12 dalam 3 jam"],
    [-4, "Turun 4 dalam 3 jam"],
    [0, "Stabil dalam 3 jam"],
    [null, null],
  ])("%s → %s", (change, label) => {
    expect(formatChange(change)).toBe(label);
  });
});

describe("formatDay", () => {
  it("menamakan esok dan hari seterusnya", () => {
    expect(formatDay("2026-10-12", "2026-10-11")).toBe("Esok");
    expect(formatDay("2026-10-13", "2026-10-11")).toBe("Sel 13/10");
    expect(formatDay("2026-10-18", "2026-10-11")).toBe("Ahd 18/10");
  });
});

describe("format EN", () => {
  it("menggunakan AM/PM dan teks Inggeris", () => {
    expect(formatHour("2026-10-11T22:00", "en")).toBe("10 PM");
    expect(formatHour("2026-10-11T00:00", "en")).toBe("12 AM");
    expect(formatHour("2026-10-11T12:00", "en")).toBe("12 PM");
    expect(formatClock("2026-10-11T09:30", "en")).toBe("9:30 AM");
    expect(
      formatWindow("2026-10-12T05:00", "2026-10-12T07:00", "2026-10-11", "en"),
    ).toBe("Tomorrow, 5 – 7 AM");
    expect(
      formatWindow("2026-10-11T11:00", "2026-10-11T13:00", "2026-10-11", "en"),
    ).toBe("11 AM – 1 PM");
    expect(formatChange(12, "en")).toBe("Up 12 in 3 hours");
    expect(formatChange(0, "en")).toBe("Steady over 3 hours");
    expect(formatDay("2026-10-14", "2026-10-11", "en")).toBe("Wed 14/10");
    expect(formatDay("2026-10-12", "2026-10-11", "en")).toBe("Tomorrow");
  });
});

describe("formatShortDate", () => {
  it("memaparkan hari, tarikh dan bulan", () => {
    expect(formatShortDate("2026-10-12")).toBe("Isn 12 Okt");
    expect(formatShortDate("2026-08-02", "en")).toBe("Sun 2 Aug");
  });
});

describe("formatLongDate", () => {
  it("hari dan tarikh penuh dalam BM dan EN", () => {
    expect(formatLongDate("2026-10-15")).toEqual({
      weekday: "Khamis",
      date: "15 Oktober 2026",
    });
    expect(formatLongDate("2026-08-02", "en")).toEqual({
      weekday: "Sunday",
      date: "2 August 2026",
    });
  });
});

describe("formatStamp", () => {
  it("waktu Malaysia dengan AM/PM", () => {
    expect(formatStamp(new Date("2026-10-16T06:15:00Z"))).toBe(
      "16 Okt · 2:15 PM",
    );
    expect(formatStamp(new Date("2026-10-15T16:05:00Z"), "en")).toBe(
      "16 Oct · 12:05 AM",
    );
  });
});
