import { describe, expect, it } from "vitest";
import {
  STATES,
  statesInMapOrder,
  findArea,
  findState,
  findStateByApimsId,
  nearestArea,
  searchAreas,
} from "./areas";
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

describe("nearestArea", () => {
  it("memilih kawasan terdekat dengan koordinat", () => {
    expect(nearestArea(3.08, 101.53).id).toBe("shah-alam");
    expect(nearestArea(1.5, 110.3).id).toBe("kuching");
  });
});

describe("searchAreas", () => {
  it("mencari mengikut nama kawasan atau negeri", () => {
    expect(searchAreas("klang").map((a) => a.id)).toContain("klang");
    expect(searchAreas("sabah").every((a) => a.state === "Sabah")).toBe(true);
    expect(searchAreas("  ")).toEqual([]);
  });
});

describe("ID negeri APIMS", () => {
  it("setiap negeri mempunyai ID APIMS unik 1–16", () => {
    const ids = STATES.map((s) => s.apimsStateId).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });

  it("mencari negeri ikut id dan ID APIMS", () => {
    expect(findState("selangor")?.apimsStateId).toBe(10);
    expect(findStateByApimsId(14)?.id).toBe("kuala-lumpur");
    expect(findStateByApimsId(null)).toBeUndefined();
  });
});

describe("statesInMapOrder", () => {
  it("menyusun negeri dari Perlis ke Johor, kemudian Sarawak, Sabah dan wilayah", () => {
    const { states, territories } = statesInMapOrder();
    expect(states.map((s) => s.id)).toEqual([
      "perlis",
      "kedah",
      "kelantan",
      "pulau-pinang",
      "terengganu",
      "perak",
      "pahang",
      "selangor",
      "negeri-sembilan",
      "melaka",
      "johor",
      "sarawak",
      "sabah",
    ]);
    expect(territories.map((s) => s.id)).toEqual([
      "kuala-lumpur",
      "putrajaya",
      "labuan",
    ]);
    expect(states.length + territories.length).toBe(STATES.length);
  });
});
