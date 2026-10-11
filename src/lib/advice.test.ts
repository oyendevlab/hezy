import { describe, expect, it } from "vitest";
import { adviceFor } from "./advice";
import { IPU_CATEGORIES } from "./ipu";

describe("adviceFor", () => {
  it("menyediakan nasihat untuk setiap kategori", () => {
    for (const { key } of IPU_CATEGORIES) {
      const advice = adviceFor(key);
      expect(advice.headline).not.toBe("");
      expect(advice.tips.length).toBeGreaterThan(0);
      expect(advice.quick).toHaveLength(3);
    }
  });

  it("meletakkan nasihat profil di hadapan", () => {
    expect(adviceFor("tidak-sihat", "asma").tips[0]).toMatch(/inhaler/);
    expect(adviceFor("tidak-sihat", "umum").tips[0]).toMatch(/N95/);
  });
});
