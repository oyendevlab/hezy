import { useEffect, useSyncExternalStore } from "react";
import type { Reading } from "./reading";

/** Bacaan dianggap segar selama 10 minit; selepas itu diambil semula. */
const FRESH_MS = 10 * 60 * 1000;
/** Bacaan separa diambil semula selepas cache CDN separa (60 s) tamat (v0.8.2). */
const PARTIAL_FRESH_MS = 75 * 1000;

const freshFor = (entry: ReadingEntry) =>
  entry.reading?.partial ? PARTIAL_FRESH_MS : FRESH_MS;
const STORAGE_PREFIX = "hezy:reading:";

export type ReadingEntry = {
  status: "loading" | "ready" | "error";
  reading?: Reading;
  /** Masa (ms epoch) bacaan terakhir berjaya diambil. */
  fetchedAt?: number;
  error?: string;
};

const entries = new Map<string, ReadingEntry>();
const listeners = new Set<() => void>();
const inFlight = new Map<string, Promise<void>>();
const retryScheduled = new Set<string>();

const keyOf = (lat: number, lon: number) =>
  `${lat.toFixed(2)},${lon.toFixed(2)}`;

function setEntry(key: string, entry: ReadingEntry) {
  entries.set(key, entry);
  listeners.forEach((listener) => listener());
}

function restore(key: string): ReadingEntry | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return undefined;
    const { reading, fetchedAt } = JSON.parse(raw) as {
      reading: Reading;
      fetchedAt: number;
    };
    return { status: "ready", reading, fetchedAt };
  } catch {
    return undefined;
  }
}

function load(key: string, force = false): Promise<void> {
  const running = inFlight.get(key);
  if (running) return running;
  const promise = fetchEntry(key, force).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

async function fetchEntry(key: string, force: boolean) {
  let entry = entries.get(key) ?? restore(key);
  if (
    !force &&
    entry?.fetchedAt &&
    Date.now() - entry.fetchedAt < freshFor(entry)
  ) {
    if (!entries.has(key)) setEntry(key, entry);
    return;
  }

  entry = { ...entry, status: "loading", error: undefined };
  setEntry(key, entry);
  const [lat, lon] = key.split(",");
  try {
    const res = await fetch(`/api/aqi?lat=${lat}&lon=${lon}`);
    const body = (await res.json()) as Reading | { error: string };
    if (!res.ok || "error" in body) {
      throw new Error("error" in body ? body.error : `Status ${res.status}`);
    }
    const fetchedAt = Date.now();
    setEntry(key, { status: "ready", reading: body, fetchedAt });
    if (body.partial) scheduleRetry(key);
    try {
      window.localStorage.setItem(
        STORAGE_PREFIX + key,
        JSON.stringify({ reading: body, fetchedAt }),
      );
    } catch {
      // Abaikan: cache peranti hanya bonus.
    }
  } catch (error) {
    const message =
      error instanceof TypeError
        ? "Tiada sambungan internet."
        : error instanceof Error
          ? error.message
          : "Ralat tidak diketahui.";
    // Kekalkan bacaan lama (jika ada) supaya skrin tidak kosong.
    setEntry(key, { ...entry, status: "error", error: message });
  }
}

/** Ambil semula bacaan separa sekali, bila cache separa sudah tamat dan tab masih aktif. */
function scheduleRetry(key: string) {
  if (retryScheduled.has(key)) return;
  retryScheduled.add(key);
  setTimeout(() => {
    retryScheduled.delete(key);
    if (document.visibilityState === "visible") void load(key);
  }, PARTIAL_FRESH_MS);
}

/** Muat semula semua bacaan yang sedang dipaparkan (tarik untuk muat semula, butang ⟳). */
export function refreshReadings(): Promise<void> {
  return Promise.all([...entries.keys()].map((key) => load(key, true))).then(
    () => undefined,
  );
}

/** Ambil semula bacaan yang sudah lebih 10 minit (cth. bila tab kembali aktif). */
export function refreshStaleReadings() {
  for (const key of entries.keys()) void load(key);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Ambil bacaan IPU untuk koordinat. `null` → tiada lokasi dipilih. */
export function useReading(coords: { lat: number; lon: number } | null) {
  const key = coords ? keyOf(coords.lat, coords.lon) : null;
  const entry = useSyncExternalStore(
    subscribe,
    () => (key ? entries.get(key) : undefined),
    () => undefined,
  );

  useEffect(() => {
    if (key) void load(key);
  }, [key]);

  return {
    entry,
    refresh: () => {
      if (key) void load(key, true);
    },
  };
}
