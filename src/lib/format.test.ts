import { describe, expect, it } from "vitest";
import { formatChange, formatClock, formatHour, formatWindow } from "./format";

describe("formatHour", () => {
  it.each([
    ["2026-10-11T00:00", "12 tengah malam"],
    ["2026-10-11T07:00", "7 pagi"],
    ["2026-10-11T12:00", "12 tengah hari"],
    ["2026-10-11T15:00", "3 petang"],
    ["2026-10-11T22:00", "10 malam"],
  ])("%s → %s", (time, label) => {
    expect(formatHour(time)).toBe(label);
  });

  it("formatClock memaparkan minit", () => {
    expect(formatClock("2026-10-11T10:00")).toBe("10:00 pagi");
  });
});

describe("formatWindow", () => {
  it("menggabungkan julat dalam tempoh yang sama", () => {
    expect(
      formatWindow("2026-10-11T21:00", "2026-10-11T23:00", "2026-10-11"),
    ).toBe("9 – 11 malam");
  });

  it("memaparkan dua tempoh dan menanda esok", () => {
    expect(
      formatWindow("2026-10-12T05:00", "2026-10-12T07:00", "2026-10-11"),
    ).toBe("Esok, 5 – 7 pagi");
    expect(
      formatWindow("2026-10-11T11:00", "2026-10-11T13:00", "2026-10-11"),
    ).toBe("11 pagi – 1 petang");
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
