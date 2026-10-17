// Simulasi sumber luar terganggu semasa `next build` (v0.8.13). Dimuat melalui NODE_OPTIONS supaya
// pekerja prarender turut terkesan: npm run build:tanpa-sumber
//
// HEZY_SEKAT_MOD=gagal (lalai, ralat rangkaian serta-merta) | tergantung (tiada respons hingga
// isyarat tamat masa pemanggil) | 503. Build mesti lulus dalam semua mod (CI 17 Okt 2026:
// `/negeri/johor` gagal diprarender kerana APIMS tamat masa).

const HOSTS = [
  "eqms.doe.gov.my", // APIMS
  "open-meteo.com", // Open-Meteo (kualiti udara, cuaca, grid angin)
  "api.data.gov.my", // MetMalaysia
  "firms.modaps.eosdis.nasa.gov", // FIRMS
  "api.waqi.info", // WAQI
];
const MODE = process.env.HEZY_SEKAT_MOD || "gagal";
const originalFetch = globalThis.fetch;
const logged = new Set();
/** Rujukan kuat kepada isyarat yang menunggu (seperti undici) supaya AbortSignal.timeout tidak dikutip GC. */
const pending = new Set();

function blockedHost(input) {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input?.url;
  try {
    const { hostname } = new URL(url);
    return HOSTS.find((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return undefined;
  }
}

globalThis.fetch = function fetchTanpaSumber(input, init) {
  const host = blockedHost(input);
  if (!host) return originalFetch(input, init);
  if (!logged.has(host)) {
    logged.add(host);
    console.error(`[sekat-sumber:${process.pid}] ${host} disekat (${MODE})`);
  }
  if (MODE === "503")
    return Promise.resolve(new Response("disekat", { status: 503 }));
  if (MODE !== "tergantung")
    return Promise.reject(new TypeError("fetch failed (sekat-sumber)"));
  return new Promise((_, reject) => {
    const signal = init?.signal ?? input?.signal;
    if (!signal) return;
    if (signal.aborted) return reject(signal.reason);
    pending.add(signal);
    const keepAlive = setInterval(() => {}, 1000);
    signal.addEventListener(
      "abort",
      () => {
        pending.delete(signal);
        clearInterval(keepAlive);
        reject(signal.reason);
      },
      { once: true },
    );
  });
};
