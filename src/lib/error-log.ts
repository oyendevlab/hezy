/**
 * Pemantauan ralat klien tanpa pihak ketiga (item 13).
 * Hanya mesej, jejak tindanan (tanpa query string), laluan halaman, versi dan jenis pelayar
 * disimpan: tiada IP, lokasi atau data peribadi.
 */

export type ErrorReport = {
  kind: "error" | "rejection" | "render";
  message: string;
  stack: string;
  /** Laluan sahaja, tanpa query atau hash. */
  path: string;
  version: string;
  /** Cth. "Chrome 126 · Android". */
  browser: string;
};

export const MAX_MESSAGE = 300;
export const MAX_STACK = 2000;
export const MAX_BODY_BYTES = 4096;

const KINDS = ["error", "rejection", "render"] as const;

/** Buang query string dan hash daripada URL dalam teks (cth. jejak tindanan). */
export const stripQueries = (text: string) =>
  text.replace(
    // Kekalkan ":baris:lajur" selepas query dalam jejak tindanan.
    /(https?:\/\/[^\s?#)]+)[?#][^\s)]*?(?=(?::\d+(?::\d+)?)?(?:\)|\s|$))/g,
    "$1",
  );

/** Ralat yang bukan daripada kod Hezy (sambungan pelayar, skrip luar, hingar pelayar). */
export function isNoise(message: string, stack: string, origin: string) {
  if (/ResizeObserver loop|Script error\.?$|^Load failed$/i.test(message))
    return true;
  if (/(chrome|moz|safari(-web)?)-extension:\/\//.test(stack)) return true;
  // Mesti melibatkan skrip Hezy sendiri (atau tiada jejak langsung, cth. ralat render).
  return stack !== "" && !stack.includes(origin) && !stack.includes("/_next/");
}

export function browserFamily(ua: string): string {
  const name =
    /Edg\/(\d+)/.exec(ua)?.[0].replace("Edg/", "Edge ") ??
    /SamsungBrowser\/(\d+)/
      .exec(ua)?.[0]
      .replace("SamsungBrowser/", "Samsung ") ??
    /Firefox\/(\d+)/.exec(ua)?.[0].replace("/", " ") ??
    /Chrome\/(\d+)/.exec(ua)?.[0].replace("/", " ") ??
    (/Version\/(\d+).*Safari/.exec(ua)
      ? `Safari ${/Version\/(\d+)/.exec(ua)![1]}`
      : "Lain");
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Lain";
  return `${name} · ${os}`;
}

/** Sahkan dan potong laporan daripada klien. */
export function parseReport(body: unknown): ErrorReport | null {
  const b = body as Partial<Record<keyof ErrorReport, unknown>> | null;
  if (typeof b?.message !== "string" || !b.message.trim()) return null;
  const str = (v: unknown, max: number) =>
    typeof v === "string" ? v.slice(0, max) : "";
  const path = str(b.path, 200);
  return {
    kind: KINDS.includes(b.kind as ErrorReport["kind"])
      ? (b.kind as ErrorReport["kind"])
      : "error",
    message: stripQueries(b.message.trim()).slice(0, MAX_MESSAGE),
    stack: stripQueries(str(b.stack, MAX_STACK * 2)).slice(0, MAX_STACK),
    path: path.startsWith("/") ? path.split(/[?#]/)[0] : "/",
    version: str(b.version, 20).replace(/[^\w.-]/g, ""),
    browser: str(b.browser, 60),
  };
}

/** Cap jari: mesej + bingkai pertama jejak tindanan (tanpa nombor lajur yang berubah). */
export function fingerprintSource(report: ErrorReport): string {
  const frame = report.stack
    .split("\n")
    .find((l) => l.includes("/_next/") || l.includes("at "))
    ?.replace(/:\d+:\d+/g, "")
    .trim();
  return `${report.kind}|${report.message}|${frame ?? ""}`;
}

/** Rekod ralat bagi satu hari dan cap jari. */
export type ErrorRecord = ErrorReport & {
  count: number;
  firstSeen: string;
  lastSeen: string;
};

export function mergeError(
  existing: ErrorRecord | null,
  report: ErrorReport,
  now: Date,
): ErrorRecord {
  return {
    ...report,
    count: (existing?.count ?? 0) + 1,
    firstSeen: existing?.firstSeen ?? now.toISOString(),
    lastSeen: now.toISOString(),
  };
}
