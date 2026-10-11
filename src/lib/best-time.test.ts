import { describe, expect, it } from "vitest";
import { findBestWindow } from "./best-time";

const hours = [120, 130, 90, 80, 85, 140, null, 60].map((ipu, i) => ({
  time: `T${i}`,
  ipu,
}));

describe("findBestWindow", () => {
  it("mencari purata terendah bagi 3 jam berturut-turut", () => {
    expect(findBestWindow(hours, 0)).toEqual({
      start: "T2",
      end: "T4",
      averageIpu: 85,
    });
  });

  it("mengabaikan tetingkap yang mempunyai bacaan kosong", () => {
    expect(findBestWindow(hours, 5)).toBeNull();
  });

  it("bermula dari indeks yang diberi", () => {
    expect(findBestWindow(hours, 3)?.start).toBe("T3");
  });
});
