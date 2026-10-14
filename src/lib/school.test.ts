import { describe, expect, it } from "vitest";
import { schoolPersistentHigh, schoolStatus } from "./school";

describe("schoolStatus", () => {
  it.each([
    [0, "normal"],
    [100, "normal"],
    [101, "no-outdoor"],
    [200, "no-outdoor"],
    [201, "closed"],
  ])("IPU %d → %s", (ipu, level) => {
    expect(schoolStatus(ipu).level).toBe(level);
  });

  it("tajuk ringkas tanpa ambang atau arahan operasi sekolah", () => {
    for (const ipu of [50, 150, 250]) {
      const { title } = schoolStatus(ipu);
      expect(title).not.toMatch(/\d|dibuka/);
    }
  });
});

describe("schoolPersistentHigh", () => {
  it("dua hari terakhir > 150 pada jam 2 petang", () => {
    expect(schoolPersistentHigh([null, 160, 172])).toBe(172);
    expect(schoolPersistentHigh([170, 140, 172])).toBeNull();
    expect(schoolPersistentHigh([170, 170, null])).toBeNull();
    expect(schoolPersistentHigh([172])).toBeNull();
  });
});
