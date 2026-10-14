import { describe, expect, it } from "vitest";
import { schoolStatus, schoolTomorrow } from "./school";

describe("schoolStatus", () => {
  it.each([
    [0, "normal"],
    [100, "normal"],
    [101, "no-outdoor"],
    [180, "no-outdoor"],
    [181, "closed"],
    [450, "closed"],
  ])("IPU %d → %s", (ipu, level) => {
    expect(schoolStatus(ipu).level).toBe(level);
  });

  it("menyebut garis panduan KPM bila ada sekatan", () => {
    expect(schoolStatus(150).detail).toMatch(/KPM/);
    expect(schoolStatus(250).title).toBe("Sekolah mungkin ditutup");
  });
});

describe("schoolTomorrow", () => {
  it("null sebelum bacaan jam 2 petang hari ini atau bila ≤ 150", () => {
    expect(schoolTomorrow([170, 170, null])).toBeNull();
    expect(schoolTomorrow([170, 170, 150])).toBeNull();
  });

  it("IPU > 180 hari ini: mungkin ditutup esok", () => {
    expect(schoolTomorrow([null, null, 181])).toEqual({
      level: "likely",
      ipu: 181,
      streak: 1,
    });
  });

  it("> 150 tiga hari berturut-turut: mungkin ditutup; kurang: pantau", () => {
    expect(schoolTomorrow([151, 160, 155])).toMatchObject({
      level: "likely",
      streak: 3,
    });
    expect(schoolTomorrow([140, 160, 155])).toMatchObject({
      level: "watch",
      streak: 2,
    });
    expect(schoolTomorrow([160, null, 155])).toMatchObject({
      level: "watch",
      streak: 1,
    });
  });
});
