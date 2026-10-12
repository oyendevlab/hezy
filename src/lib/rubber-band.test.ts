import { describe, expect, it } from "vitest";
import { PULL_MAX, PULL_THRESHOLD, rubberBand } from "./rubber-band";

describe("rubberBand", () => {
  it("bermula linear, semakin perlahan, tidak melepasi had", () => {
    expect(rubberBand(0)).toBe(0);
    expect(rubberBand(-50)).toBe(0);
    expect(rubberBand(10)).toBeCloseTo(8.5, 0);
    const a = rubberBand(100);
    const b = rubberBand(200) - rubberBand(100);
    expect(b).toBeLessThan(a);
    expect(rubberBand(10_000)).toBeLessThanOrEqual(PULL_MAX);
    expect(rubberBand(10_000)).toBeGreaterThan(PULL_MAX - 1);
  });

  it("ambang dicapai dengan tarikan jari kira-kira 100 px", () => {
    expect(rubberBand(80)).toBeLessThan(PULL_THRESHOLD);
    expect(rubberBand(120)).toBeGreaterThan(PULL_THRESHOLD);
  });
});
