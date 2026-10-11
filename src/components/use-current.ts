"use client";

import { usePrefs } from "@/lib/prefs";
import { useReading } from "@/lib/use-reading";

/** Prefs + bacaan untuk lokasi semasa. `prefs === null` semasa hidrasi. */
export function useCurrent() {
  const prefs = usePrefs();
  const location = prefs?.current ?? null;
  const { entry, refresh } = useReading(location);
  return { prefs, location, entry, refresh };
}
