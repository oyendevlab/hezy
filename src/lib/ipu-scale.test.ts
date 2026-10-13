import { describe, expect, it } from "vitest";
import { levelRange, scalePosition } from "./ipu-scale";

describe("scalePosition", () => {
  it("lima tahap sama lebar", () => {
    expect(scalePosition(0)).toBe(0);
    expect(scalePosition(50)).toBeCloseTo(0.2);
    expect(scalePosition(100)).toBeCloseTo(0.4);
    expect(scalePosition(150)).toBeCloseTo(0.5);
    expect(scalePosition(300)).toBeCloseTo(0.8);
  });
  it("diapit di hujung bar", () => {
    expect(scalePosition(900)).toBe(1);
    expect(scalePosition(-5)).toBe(0);
  });
});

describe("levelRange", () => {
  it("julat setiap tahap", () => {
    expect(levelRange(0)).toBe("0–50");
    expect(levelRange(2)).toBe("101–200");
    expect(levelRange(4)).toBe("> 300");
  });
});
