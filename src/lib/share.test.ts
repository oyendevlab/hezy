import { describe, expect, it } from "vitest";
import { buildSharePath, parseShare } from "./share";

describe("buildSharePath", () => {
  it("membina pautan kongsi", () => {
    expect(
      buildSharePath({ name: "Shah Alam", ipu: 72.4, source: "apims" }),
    ).toBe("/kongsi?n=Shah+Alam&i=72&s=apims");
  });
});

describe("parseShare", () => {
  it("mengira kategori daripada IPU, bukan daripada parameter", () => {
    expect(
      parseShare({ n: "Shah Alam", i: "172", s: "apims", k: "baik" }),
    ).toEqual({
      name: "Shah Alam",
      ipu: 172,
      category: "tidak-sihat",
      label: "Tidak Sihat",
      source: "apims",
      state: null,
    });
  });

  it("membersihkan nama dan menghadkan panjangnya", () => {
    const parsed = parseShare({
      n: "<b>Klang</b>\u0007" + "x".repeat(60),
      i: "50",
    });
    expect(parsed?.name).toBe("bKlang/b" + "x".repeat(32));
    expect(parsed?.source).toBe("model");
  });

  it("menolak IPU atau nama tidak sah", () => {
    expect(parseShare({ n: "Klang", i: "abc" })).toBeNull();
    expect(parseShare({ n: "Klang", i: "1000" })).toBeNull();
    expect(parseShare({ n: "  ", i: "50" })).toBeNull();
  });
});

describe("bendera negeri dalam pautan kongsi", () => {
  it("negeri sah disimpan; yang lain diabaikan", () => {
    const path = buildSharePath({
      name: "Shah Alam",
      ipu: 72,
      source: "apims",
      state: "selangor",
    });
    expect(path).toContain("g=selangor");
    const q = (p: string) =>
      Object.fromEntries(new URL(p, "https://hezy.my").searchParams);
    expect(parseShare(q(path))?.state).toBe("selangor");
    expect(parseShare({ n: "X", i: "50", g: "bukan" })?.state).toBeNull();
    expect(
      buildSharePath({ name: "X", ipu: 50, source: "model", state: null }),
    ).not.toContain("g=");
  });
});
