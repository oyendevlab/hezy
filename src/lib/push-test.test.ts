import { describe, expect, it } from "vitest";
import { TEST_COOLDOWN_MS, cooldownSeconds, testPayload } from "./push-test";

describe("cooldownSeconds", () => {
  it("dibenarkan jika belum pernah dihantar", () => {
    expect(cooldownSeconds(undefined, 1000)).toBe(0);
  });
  it("baki saat dibundarkan ke atas", () => {
    expect(cooldownSeconds(0, 1)).toBe(60);
    expect(cooldownSeconds(0, 30_500)).toBe(30);
    expect(cooldownSeconds(0, TEST_COOLDOWN_MS)).toBe(0);
    expect(cooldownSeconds(0, TEST_COOLDOWN_MS + 5000)).toBe(0);
  });
});

describe("testPayload", () => {
  it("tag sendiri dan bahasa pengguna", () => {
    expect(testPayload("en")).toMatchObject({
      tag: "hezy-test",
      lang: "en",
      url: "/tetapan",
    });
    expect(testPayload().title).toContain("ujian");
  });
});
