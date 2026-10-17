import { useSyncExternalStore } from "react";
import type { HealthProfile } from "./advice";
import { isLang, type Lang } from "./i18n";
import type { PushOptions } from "./push-validate";
import { PREFS_KEY } from "./storage-keys";

export { PREFS_KEY };

/** Lokasi yang disimpan di peranti. `source` menunjukkan asal koordinat. */
export type SavedLocation = {
  id: string;
  name: string;
  /** Negeri atau keterangan tambahan, cth. "Selangor" (GPS lama: "Lokasi semasa"). */
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
  /** Id lokasi kegemaran yang turut menerima amaran. */
  alertFavourites: string[];
  /** Bahasa antara muka. */
  lang: Lang;
  /** Ringkasan pagi jam 7 (item 5). */
  morningSummary: boolean;
  /** Amaran ramalan esok jam 8 malam (item 7). */
  forecastAlert: boolean;
  /** Amaran lonjakan IPU (v0.7.0). */
  spikeAlert: boolean;
  /** Amaran jerebu dijangka dalam 6 jam (v0.7.0). */
  expectedAlert: boolean;
  /** Waktu senyap (jam waktu Malaysia); `null` = mati (item 6). */
  quietHours: { start: number; end: number } | null;
  /** Nombor IPU lokasi semasa pada ikon aplikasi (v0.7.8). */
  iconBadge: boolean;
};

export const MAX_FAVOURITES = 5;

export const DEFAULT_PREFS: Prefs = {
  current: null,
  favourites: [],
  profile: "umum",
  theme: "system",
  showSchool: false,
  alertThreshold: null,
  alertFavourites: [],
  lang: "ms",
  morningSummary: false,
  forecastAlert: true,
  spikeAlert: true,
  expectedAlert: true,
  quietHours: { start: 23, end: 6 },
  iconBadge: true,
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

const isHour = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 23;

function isHourRange(v: unknown): v is { start: number; end: number } {
  const r = v as { start?: unknown; end?: unknown } | null;
  return isHour(r?.start) && isHour(r?.end) && r.start !== r.end;
}

/** Pilihan rutin amaran untuk dihantar bersama langganan push. */
export function pushOptions(prefs: Prefs): PushOptions {
  return {
    morning: prefs.morningSummary,
    forecast: prefs.forecastAlert,
    spike: prefs.spikeAlert,
    expected: prefs.expectedAlert,
    school: prefs.profile === "anak" || prefs.showSchool,
    quiet: prefs.quietHours,
    badge: prefs.iconBadge,
  };
}

/** Lokasi GPS lama disimpan sebagai "Berhampiran X"; kini nama bandar terdekat sahaja. */
function migrateLocation(l: SavedLocation): SavedLocation {
  return l.source === "gps" && l.name.startsWith("Berhampiran ")
    ? { ...l, name: l.name.slice("Berhampiran ".length) }
    : l;
}

/** Baca prefs daripada JSON tersimpan, buang medan yang rosak. */
export function parsePrefs(raw: string | null): Prefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const v = JSON.parse(raw) as Partial<Prefs>;
    return {
      current: isLocation(v.current) ? migrateLocation(v.current) : null,
      favourites: Array.isArray(v.favourites)
        ? v.favourites
            .filter(isLocation)
            .map(migrateLocation)
            .slice(0, MAX_FAVOURITES)
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
      alertFavourites: Array.isArray(v.alertFavourites)
        ? v.alertFavourites
            .filter((id): id is string => typeof id === "string")
            .slice(0, MAX_FAVOURITES)
        : [],
      lang: isLang(v.lang) ? v.lang : "ms",
      morningSummary: v.morningSummary === true,
      forecastAlert: v.forecastAlert !== false,
      spikeAlert: v.spikeAlert !== false,
      expectedAlert: v.expectedAlert !== false,
      quietHours:
        v.quietHours === null
          ? null
          : isHourRange(v.quietHours)
            ? { start: v.quietHours.start, end: v.quietHours.end }
            : DEFAULT_PREFS.quietHours,
      iconBadge: v.iconBadge !== false,
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
  return {
    ...prefs,
    favourites: prefs.favourites.filter((f) => f.id !== id),
    alertFavourites: prefs.alertFavourites.filter((x) => x !== id),
  };
}

/** Pindah kegemaran `id` ke kedudukan `to` (diapit ke julat senarai). */
export function moveFavourite(prefs: Prefs, id: string, to: number): Prefs {
  const from = prefs.favourites.findIndex((f) => f.id === id);
  if (from < 0) return prefs;
  const target = Math.min(Math.max(to, 0), prefs.favourites.length - 1);
  if (target === from) return prefs;
  const favourites = [...prefs.favourites];
  const [item] = favourites.splice(from, 1);
  favourites.splice(target, 0, item);
  return { ...prefs, favourites };
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
  document.documentElement.lang = next.lang;
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

export function toggleAlertFavourite(prefs: Prefs, id: string): Prefs {
  const on = prefs.alertFavourites.includes(id);
  return {
    ...prefs,
    alertFavourites: on
      ? prefs.alertFavourites.filter((x) => x !== id)
      : [...prefs.alertFavourites, id],
  };
}

/** Lokasi yang menerima amaran: lokasi semasa + kegemaran yang dipilih (tanpa pendua). */
export function alertLocations(
  prefs: Pick<Prefs, "current" | "favourites" | "alertFavourites">,
): SavedLocation[] {
  const list: SavedLocation[] = prefs.current ? [prefs.current] : [];
  for (const f of prefs.favourites) {
    if (!prefs.alertFavourites.includes(f.id)) continue;
    if (list.some((l) => l.id === f.id || (l.lat === f.lat && l.lon === f.lon)))
      continue;
    list.push(f);
  }
  return list;
}
