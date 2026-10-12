import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SPLASH_SCREENS, startupImages } from "./splash";

describe("startupImages", () => {
  it("dua tema bagi setiap saiz, tanpa pendua", () => {
    const images = startupImages();
    expect(images).toHaveLength(SPLASH_SCREENS.length * 2);
    expect(new Set(images.map((i) => i.media)).size).toBe(images.length);
    expect(new Set(images.map((i) => i.url)).size).toBe(images.length);
  });
  it("media mengikut saiz CSS dan nisbah piksel", () => {
    expect(startupImages()).toContainEqual({
      url: "/splash/splash-1179x2556-dark.png",
      media:
        "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)",
    });
  });
  it("setiap imej wujud dalam public/", () => {
    for (const { url } of startupImages())
      expect(existsSync(`public${url}`), url).toBe(true);
  });
});
