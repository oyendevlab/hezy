import { describe, expect, it, vi } from "vitest";
import { silenceUrlParseDeprecation } from "./web-push";

describe("silenceUrlParseDeprecation (v0.8.14)", () => {
  it("hanya DEP0169 disenyapkan; amaran lain diteruskan", () => {
    const emitWarning = vi.fn();
    const fake = { emitWarning } as unknown as NodeJS.Process;
    silenceUrlParseDeprecation(fake);
    fake.emitWarning("url.parse()", "DeprecationWarning", "DEP0169");
    fake.emitWarning("url.parse()", {
      type: "DeprecationWarning",
      code: "DEP0169",
    });
    fake.emitWarning("lain", "DeprecationWarning", "DEP0005");
    expect(emitWarning).toHaveBeenCalledTimes(1);
    expect(emitWarning).toHaveBeenCalledWith(
      "lain",
      "DeprecationWarning",
      "DEP0005",
    );
    // Dipasang sekali sahaja.
    silenceUrlParseDeprecation(fake);
    fake.emitWarning("lain2", "Warning");
    expect(emitWarning).toHaveBeenCalledTimes(2);
  });
});
