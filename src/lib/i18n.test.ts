import { describe, expect, it } from "vitest";
import { translate } from "./i18n";

describe("translate", () => {
  it("memulangkan teks BM tanpa perubahan", () => {
    expect(translate("ms", "Lokasi semasa")).toBe("Lokasi semasa");
  });

  it("menterjemah ke EN dan mengisi pembolehubah", () => {
    expect(translate("en", "Lokasi semasa")).toBe("Current location");
    expect(
      translate("en", "Jerebu di {name}: IPU {ipu} ({label})", {
        name: "Klang",
        ipu: 156,
        label: "Unhealthy",
      }),
    ).toBe("Haze in Klang: API 156 (Unhealthy)");
    expect(translate("ms", "Untuk {name}", { name: "Klang" })).toBe(
      "Untuk Klang",
    );
  });

  it("menterjemah nama lokasi GPS", () => {
    expect(translate("en", "Berhampiran Shah Alam")).toBe("Near Shah Alam");
    expect(translate("en", "Shah Alam")).toBe("Shah Alam");
  });

  it("menggunakan teks BM bila tiada terjemahan", () => {
    expect(translate("en", "Teks baharu yang belum diterjemah")).toBe(
      "Teks baharu yang belum diterjemah",
    );
  });
});
