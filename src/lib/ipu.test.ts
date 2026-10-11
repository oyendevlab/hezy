import { describe, expect, it } from "vitest";
import { ipuCategory, isEmergency, pm25ToIpu, rolling24hAverage } from "./ipu";

describe("pm25ToIpu", () => {
  it.each([
    [0, 0],
    [12.0, 50],
    [12.1, 51],
    [35, 69],
    [75.4, 100],
    [75.5, 101],
    [150.4, 200],
    [150.5, 201],
    [250.4, 300],
    [250.5, 301],
    [350.5, 401],
    [500.4, 500],
  ])("PM2.5 %d µg/m³ → IPU %d", (pm25, ipu) => {
    expect(pm25ToIpu(pm25)).toBe(ipu);
  });

  it("menolak nilai negatif atau bukan nombor", () => {
    expect(() => pm25ToIpu(-1)).toThrow(RangeError);
    expect(() => pm25ToIpu(Number.NaN)).toThrow(RangeError);
  });
});

describe("rolling24hAverage", () => {
  it("memerlukan sekurang-kurangnya 18 bacaan", () => {
    const values = Array.from({ length: 18 }, () => 10);
    const result = rolling24hAverage(values);
    expect(result[16]).toBeNull();
    expect(result[17]).toBe(10);
  });

  it("mengabaikan bacaan null dan hanya mengambil 24 jam terakhir", () => {
    const values: (number | null)[] = [
      ...Array.from({ length: 24 }, () => 100),
      ...Array.from({ length: 24 }, () => 20),
    ];
    values[30] = null;
    expect(rolling24hAverage(values)[47]).toBe(20);
  });
});

describe("ipuCategory", () => {
  it.each([
    [0, "baik"],
    [50, "baik"],
    [51, "sederhana"],
    [100, "sederhana"],
    [101, "tidak-sihat"],
    [200, "tidak-sihat"],
    [201, "sangat-tidak-sihat"],
    [300, "sangat-tidak-sihat"],
    [301, "berbahaya"],
    [800, "berbahaya"],
  ])("IPU %d → %s", (ipu, key) => {
    expect(ipuCategory(ipu).key).toBe(key);
  });

  it("menanda kecemasan bila IPU melebihi 500", () => {
    expect(isEmergency(500)).toBe(false);
    expect(isEmergency(501)).toBe(true);
  });
});
