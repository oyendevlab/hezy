import { describe, expect, it } from "vitest";
import { HEALTH_PROFILES, adviceFor } from "@/lib/advice";
import { IPU_CATEGORIES } from "@/lib/ipu";
import { ADVICE_TIPS_WITH_ICON } from "./advice-icon";
import { weatherLook } from "./weather-icon";

describe("ikon nasihat", () => {
  it("setiap tip bagi setiap kategori dan profil mempunyai ikon sendiri", () => {
    const tips = new Set(
      IPU_CATEGORIES.flatMap((c) =>
        HEALTH_PROFILES.flatMap((p) => adviceFor(c.key, p.key).tips),
      ),
    );
    const missing = [...tips].filter((t) => !ADVICE_TIPS_WITH_ICON.includes(t));
    expect(missing).toEqual([]);
  });
});

describe("weatherLook", () => {
  it("jerebu diutamakan kecuali ketika hujan; siang/malam", () => {
    expect(weatherLook(0, true).label).toBe("Cerah");
    expect(weatherLook(0, true, true).label).toBe("Berjerebu");
    expect(weatherLook(80, true, true, 2).label).toBe("Hujan");
    expect(weatherLook(95, false).label).toBe("Ribut petir");
    expect(weatherLook(2, false).icon).not.toBe(weatherLook(2, true).icon);
  });
});
