import { describe, expect, it } from "vitest";
import { installStatus } from "./install";

describe("installStatus", () => {
  it("mengutamakan status sudah dipasang", () => {
    expect(
      installStatus({ standalone: true, ios: true, canPrompt: true }),
    ).toBe("installed");
  });

  it("menawarkan butang pasang bila pelayar menyokongnya", () => {
    expect(
      installStatus({ standalone: false, ios: false, canPrompt: true }),
    ).toBe("available");
  });

  it("memberi arahan manual untuk iOS dan pelayar lain", () => {
    expect(
      installStatus({ standalone: false, ios: true, canPrompt: false }),
    ).toBe("ios");
    expect(
      installStatus({ standalone: false, ios: false, canPrompt: false }),
    ).toBe("manual");
  });
});
