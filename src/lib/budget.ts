/**
 * Had masa untuk sumber pilihan (v0.8.2): cuaca, titik panas dan ketepatan tidak boleh
 * melambatkan nombor IPU. Promise asal tidak dibatalkan, jadi ia masih boleh siap (dan
 * mengisi cache) selepas respons dihantar.
 */
export type Budgeted<T> =
  | { status: "ok"; value: T }
  | { status: "late" }
  | { status: "error"; error: unknown };

export function withinBudget<T>(
  promise: Promise<T>,
  ms: number,
): Promise<Budgeted<T>> {
  return new Promise((resolve) => {
    const timer = setTimeout(
      () => resolve({ status: "late" }),
      Math.max(0, ms),
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve({ status: "ok", value });
      },
      (error: unknown) => {
        clearTimeout(timer);
        resolve({ status: "error", error });
      },
    );
  });
}

/** Tandakan promise sebagai sudah dikendalikan supaya penolakan awal tidak dilaporkan "unhandled". */
export function handled<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => undefined);
  return promise;
}

/**
 * Nilai terakhir yang berjaya bagi setiap kunci (dalam memori instans, LRU kecil). Digunakan
 * sebagai sandaran bila sumber luar gagal; nilai lebih tua daripada `maxAgeMs` diabaikan.
 */
export function createLastGoodStore<T>(maxEntries: number, maxAgeMs: number) {
  const entries = new Map<string, { value: T; at: number }>();
  return {
    remember(key: string, value: T, now = Date.now()) {
      entries.delete(key);
      entries.set(key, { value, at: now });
      if (entries.size > maxEntries) {
        const oldest = entries.keys().next().value;
        if (oldest !== undefined) entries.delete(oldest);
      }
    },
    recall(key: string, now = Date.now()): T | undefined {
      const saved = entries.get(key);
      return saved && now - saved.at <= maxAgeMs ? saved.value : undefined;
    },
  };
}
