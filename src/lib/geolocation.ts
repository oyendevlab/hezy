export type GeoResult =
  | { ok: true; lat: number; lon: number }
  | { ok: false; reason: "denied" | "unavailable" | "unsupported" };

/** Minta lokasi GPS sekali. Hanya dipanggil bila pengguna menekan butang. */
export function requestPosition(): Promise<GeoResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      (err) =>
        resolve({
          ok: false,
          reason: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
        }),
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 15 * 60 * 1000,
      },
    );
  });
}

export const GEO_ERROR_MESSAGE: Record<
  "denied" | "unavailable" | "unsupported",
  string
> = {
  denied: "Akses lokasi ditolak. Pilih kawasan secara manual di bawah.",
  unavailable:
    "Lokasi tidak dapat dikesan. Cuba lagi atau pilih kawasan secara manual.",
  unsupported: "Peranti ini tidak menyokong GPS. Pilih kawasan secara manual.",
};
