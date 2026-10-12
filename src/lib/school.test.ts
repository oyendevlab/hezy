import { describe, expect, it } from "vitest";
import { schoolStatus } from "./school";

describe("schoolStatus", () => {
  it.each([
    [0, "normal"],
    [100, "normal"],
    [101, "no-outdoor"],
    [200, "no-outdoor"],
    [201, "closed"],
    [450, "closed"],
  ])("IPU %d → %s", (ipu, level) => {
    expect(schoolStatus(ipu).level).toBe(level);
  });

  it("menyebut garis panduan KPM bila ada sekatan", () => {
    expect(schoolStatus(150).detail).toMatch(/KPM/);
    expect(schoolStatus(250).title).toBe("Sekolah mungkin ditutup");
  });
});
