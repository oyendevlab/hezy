import { describe, expect, it } from "vitest";
import { CHANGELOG } from "./changelog";
import { translate } from "./i18n";
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

describe("CHANGELOG dalam Bahasa Inggeris", () => {
  // "Apa yang baharu" memaparkan 3 keluaran terkini; setiap teks mesti ada dalam kamus EN.
  it("tajuk dan perkara 3 keluaran terkini diterjemah", () => {
    for (const r of CHANGELOG.slice(0, 3)) {
      for (const text of [r.title, ...r.items])
        expect(translate("en", text), text).not.toBe(text);
    }
  });
});
