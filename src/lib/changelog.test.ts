import { describe, expect, it } from "vitest";
import { CHANGELOG } from "./changelog";
import { APP_VERSION } from "./version";

describe("CHANGELOG", () => {
  it("entri pertama ialah versi semasa (kemas kini setiap keluaran)", () => {
    expect(CHANGELOG[0].version).toBe(APP_VERSION);
  });

  it("tersusun dari terbaharu, tarikh sah, setiap entri ada sekurang-kurangnya satu perkara", () => {
    for (const r of CHANGELOG) {
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.items.length).toBeGreaterThan(0);
    }
    const dates = CHANGELOG.map((r) => r.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});
