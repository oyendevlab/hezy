import { describe, expect, it } from "vitest";
import { countAt } from "./count-tween";

describe("countAt", () => {
  it("bermula dan berakhir pada nilai tepat", () => {
    expect(countAt(80, 156, 0)).toBe(80);
    expect(countAt(80, 156, 1)).toBe(156);
  });
  it("ease-out: lebih separuh jalan pada separuh masa", () => {
    expect(countAt(0, 100, 0.5)).toBe(88);
  });
  it("kira turun juga", () => {
    expect(countAt(156, 80, 1)).toBe(80);
    expect(countAt(156, 80, 0.5)).toBeLessThan(118);
  });
  it("t di luar julat diapit", () => {
    expect(countAt(10, 20, -1)).toBe(10);
    expect(countAt(10, 20, 2)).toBe(20);
  });
});
