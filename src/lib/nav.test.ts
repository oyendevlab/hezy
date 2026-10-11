import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isActive } from "./nav";

describe("isActive", () => {
  it("menanda Utama hanya pada laluan akar", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/trend", "/")).toBe(false);
  });

  it("menanda laluan dan sub-laluan yang sepadan", () => {
    expect(isActive("/trend", "/trend")).toBe(true);
    expect(isActive("/lokasi/tambah", "/lokasi")).toBe(true);
  });

  it("tidak menanda laluan yang hanya berkongsi awalan", () => {
    expect(isActive("/trendy", "/trend")).toBe(false);
  });
});

describe("NAV_ITEMS", () => {
  it("mengandungi empat tab mengikut susunan reka bentuk", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Utama",
      "Trend",
      "Lokasi",
      "Tetapan",
    ]);
  });
});
