import { useSyncExternalStore } from "react";
import type { HealthProfile } from "./advice";
import { PREFS_KEY } from "./storage-keys";

export { PREFS_KEY };

/** Lokasi yang disimpan di peranti. `source` menunjukkan asal koordinat. */
export type SavedLocation = {
  id: string;
  name: string;
  /** Negeri atau keterangan tambahan, cth. "Selangor" atau "Lokasi semasa". */
  detail?: string;
  lat: number;
  lon: number;
  source: "gps" | "area";
};

export type ThemePref = "system" | "light" | "dark";

export type Prefs = {
  current: SavedLocation | null;
  favourites: SavedLocation[];
  profile: HealthProfile;
  theme: ThemePref;
  /** Papar kad status sekolah walaupun profil bukan Kanak-kanak. */
  showSchool: boolean;
  /** Ambang amaran pilihan pengguna; `null` = ikut profil kesihatan. */
  alertThreshold: 50 | 100 | 200 | null;
};

export const MAX_FAVOURITES = 5;

export const DEFAULT_PREFS: Prefs = {
  current: null,
  favourites: [],
  profile: "umum",
  theme: "system",
  showSchool: false,
  alertThreshold: null,
};

const PROFILES: readonly HealthProfile[] = ["umum", "anak", "asma", "emas"];
const THEMES: readonly ThemePref[] = ["system", "light", "dark"];

function isLocation(value: unknown): value is SavedLocation {
  const v = value as SavedLocation | null;
  return (
    typeof v?.id === "string" &&
    typeof v.name === "string" &&
    Number.isFinite(v.lat) &&
    Number.isFinite(v.lon) &&
    (v.source === "gps" || v.source === "area")
  );
}

/** Baca prefs daripada JSON tersimpan, buang medan yang rosak. */
export function parsePrefs(raw: string | null): Prefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const v = JSON.parse(raw) as Partial<Prefs>;
    return {
      current: isLocation(v.current) ? v.current : null,
      favourites: Array.isArray(v.favourites)
        ? v.favourites.filter(isLocation).slice(0, MAX_FAVOURITES)
        : [],
      profile: PROFILES.includes(v.profile as HealthProfile)
        ? (v.profile as HealthProfile)
        : "umum",
      theme: THEMES.includes(v.theme as ThemePref)
        ? (v.theme as ThemePref)
        : "system",
      showSchool: v.showSchool === true,
      alertThreshold: [50, 100, 200].includes(v.alertThreshold as number)
        ? (v.alertThreshold as 50 | 100 | 200)
        : null,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function addFavourite(prefs: Prefs, location: SavedLocation): Prefs {
  if (prefs.favourites.some((f) => f.id === location.id)) return prefs;
  if (prefs.favourites.length >= MAX_FAVOURITES) return prefs;
  return { ...prefs, favourites: [...prefs.favourites, location] };
}

export function removeFavourite(prefs: Prefs, id: string): Prefs {
  return { ...prefs, favourites: prefs.favourites.filter((f) => f.id !== id) };
}

export function isFavourite(prefs: Prefs, id: string): boolean {
  return prefs.favourites.some((f) => f.id === id);
}

// --- Stor luaran (localStorage) untuk useSyncExternalStore ---

let snapshot: Prefs | null = null;
const listeners = new Set<() => void>();

function readStorage(): Prefs {
  try {
    return parsePrefs(window.localStorage.getItem(PREFS_KEY));
  } catch {
    return DEFAULT_PREFS;
  }
}

function getSnapshot(): Prefs {
  snapshot ??= readStorage();
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PREFS_KEY) return;
    snapshot = readStorage();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function updatePrefs(change: (prefs: Prefs) => Prefs) {
  const next = change(getSnapshot());
  if (next === snapshot) return;
  snapshot = next;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    // Storan penuh atau disekat: tetapan kekal untuk sesi ini sahaja.
  }
  applyTheme(next.theme);
  listeners.forEach((listener) => listener());
}

export function applyTheme(theme: ThemePref) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/** Prefs semasa; `null` semasa render pelayan dan hidrasi pertama. */
export function usePrefs(): Prefs | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/** Ambang amaran berkesan: pilihan pengguna, atau lalai ikut profil (50 berisiko, 100 umum). */
export function effectiveThreshold(
  prefs: Pick<Prefs, "alertThreshold" | "profile">,
): 50 | 100 | 200 {
  return prefs.alertThreshold ?? (prefs.profile === "umum" ? 100 : 50);
}
