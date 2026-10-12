import SCREENS from "./splash-screens.json";

export type SplashScreen = {
  w: number;
  h: number;
  dpr: number;
  device: string;
};
export type SplashTheme = "light" | "dark";

export const SPLASH_SCREENS: readonly SplashScreen[] = SCREENS;

/** Laluan imej pembuka iOS (dijana oleh `npm run icons`). */
export function splashPath(screen: SplashScreen, theme: SplashTheme): string {
  return `/splash/splash-${screen.w * screen.dpr}x${screen.h * screen.dpr}-${theme}.png`;
}

/** `appleWebApp.startupImage`: satu imej bagi setiap saiz skrin (potret) dan tema. */
export function startupImages(): { url: string; media: string }[] {
  return SPLASH_SCREENS.flatMap((s) =>
    (["light", "dark"] as const).map((theme) => ({
      url: splashPath(s, theme),
      media:
        `(device-width: ${s.w}px) and (device-height: ${s.h}px) and ` +
        `(-webkit-device-pixel-ratio: ${s.dpr}) and (orientation: portrait) and ` +
        `(prefers-color-scheme: ${theme})`,
    })),
  );
}
