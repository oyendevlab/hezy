import { connection } from "next/server";
import { fetchMetUpstream } from "@/lib/data";
import { localHourKey } from "@/lib/reading";

/** CDN 15 min; salinan lama boleh dihidang semasa disegarkan (amaran tamat ditapis oleh metFor). */
const FRESH_CACHE = "public, s-maxage=900, stale-while-revalidate=86400";
/** Sebahagian daripada salinan terakhir (cth. data.gov.my 429): cuba semula selepas seminit. */
const STALE_CACHE = "public, s-maxage=60, stale-while-revalidate=86400";

/**
 * GET /api/met — amaran dan ramalan MetMalaysia yang digunakan Hezy (v0.8.11), dibaca oleh
 * /api/aqi. data.gov.my hanya membenarkan 4 permintaan/minit (dikongsi alamat IP Vercel), jadi
 * semua instans membaca salinan CDN ini dan data.gov.my dipanggil ~2 kali setiap 15 minit.
 */
export async function GET() {
  await connection();
  try {
    const { bundle, stale } = await fetchMetUpstream(
      localHourKey(new Date()).slice(0, 10),
    );
    return Response.json(bundle, {
      headers: { "Cache-Control": stale ? STALE_CACHE : FRESH_CACHE },
    });
  } catch (error) {
    console.error("[api/met]", error);
    return Response.json(
      { error: "Data MetMalaysia tidak dapat diambil buat masa ini." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
