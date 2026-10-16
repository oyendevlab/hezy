import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Pengawal permintaan untuk route API (v0.8.1): rahsia cron, permintaan rentas laman dan had
 * kadar kasar. Tiada data peribadi disimpan.
 */

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * `Authorization: Bearer <CRON_SECRET>` untuk route yang dipanggil oleh GitHub Actions.
 * Dibandingkan dalam masa tetap (cincangan sama panjang) supaya rahsia tidak boleh diteka
 * melalui masa respons.
 */
export function isCronAuthorized(
  header: string | null,
  secret: string,
): boolean {
  if (!header || !secret) return false;
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}

/**
 * Permintaan pelayar yang datang dari laman lain (cth. borang atau skrip di laman pihak
 * ketiga). Klien bukan pelayar tidak menghantar pengepala ini, jadi ini bukan pengesahan,
 * hanya menutup penyalahgunaan melalui pelayar pengguna lain.
 */
export function isCrossSite(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== new URL(request.url).host;
  } catch {
    return true;
  }
}

/** Badan permintaan JSON dengan had saiz. */
export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; value: unknown } | { ok: false; status: 400 | 413 }> {
  const text = await request.text();
  if (text.length > maxBytes) return { ok: false, status: 413 };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400 };
  }
}

/**
 * Had kadar tetingkap tetap dalam memori (setiap instans fungsi). Kasar, tetapi menghadkan
 * banjir tulisan ke Blob tanpa storan tambahan.
 */
export function createWindowLimiter(max: number, windowMs = 60_000) {
  let windowStart = 0;
  let count = 0;
  return (now = Date.now()): boolean => {
    if (now - windowStart > windowMs) {
      windowStart = now;
      count = 0;
    }
    return ++count <= max;
  };
}
