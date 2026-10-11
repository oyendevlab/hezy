import { describe, expect, it } from "vitest";
import { STATES, findArea } from "./areas";
import { isInMalaysia } from "./coords";

const allAreas = STATES.flatMap((s) => s.areas);

describe("STATES", () => {
  it("merangkumi 13 negeri dan 3 wilayah persekutuan", () => {
    expect(STATES).toHaveLength(16);
  });

  it("setiap kawasan mempunyai id unik dan berada dalam Malaysia", () => {
    expect(new Set(allAreas.map((a) => a.id)).size).toBe(allAreas.length);
    for (const a of allAreas) expect(isInMalaysia(a), a.id).toBe(true);
  });
});

describe("findArea", () => {
  it("memulangkan kawasan bersama nama negeri", () => {
    expect(findArea("shah-alam")).toMatchObject({
      name: "Shah Alam",
      state: "Selangor",
    });
    expect(findArea("tiada")).toBeUndefined();
  });
});
