import { describe, expect, it } from "vitest";
import { isStateId, locationStateId } from "./state-flag";

describe("locationStateId", () => {
  it("kawasan senarai bandar ikut negerinya; GPS ikut pelayan", () => {
    expect(locationStateId({ id: "area:shah-alam" }, null)).toBe("selangor");
    expect(locationStateId({ id: "gps" }, "johor")).toBe("johor");
    expect(locationStateId({ id: "gps" }, null)).toBeNull();
    expect(locationStateId({ id: "gps" }, "atlantis")).toBeNull();
  });

  it("isStateId hanya id negeri Hezy", () => {
    expect(isStateId("pulau-pinang")).toBe(true);
    expect(isStateId("Penang")).toBe(false);
  });
});
