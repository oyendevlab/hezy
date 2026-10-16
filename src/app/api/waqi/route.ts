import { createWindowLimiter, isCrossSite } from "@/lib/request-guard";
import { waqiBoundsUrl, waqiRegionUrl } from "@/lib/waqi";

const NO_STORE = { "Cache-Control": "no-store" };
/** Had kasar setiap instans seminit (kuota token WAQI dikongsi semua pengguna). */
const allowRequest = createWindowLimiter(120);

/** Token di pelayan sahaja (v0.8.6); nama lama `NEXT_PUBLIC_` masih dibaca supaya tiada perubahan tetapan. */
const token = () =>
  process.env.WAQI_TOKEN ?? process.env.NEXT_PUBLIC_WAQI_TOKEN ?? "";

/**
 * GET /api/waqi?scope=malaysia|region — lapisan sensor WAQI melalui pelayan (v0.8.6) supaya token
 * dan alamat IP pengguna tidak terdedah kepada pihak ketiga. Terma WAQI melarang data diedarkan
 * semula sebagai cache, jadi setiap permintaan diteruskan terus: tiada cache pelayan atau CDN.
 * Hanya dua kotak tetap dibenarkan (tiada URL sebarangan).
 */
export async function GET(request: Request) {
  const key = token();
  if (!key) {
    return Response.json(
      { error: "Sensor WAQI belum dikonfigurasi." },
      { status: 503, headers: NO_STORE },
    );
  }
  if (isCrossSite(request)) {
    return Response.json(
      { error: "Tidak dibenarkan." },
      { status: 403, headers: NO_STORE },
    );
  }
  const scope = new URL(request.url).searchParams.get("scope");
  const url =
    scope === "malaysia"
      ? waqiBoundsUrl(key)
      : scope === "region"
        ? waqiRegionUrl(key)
        : null;
  if (!url) {
    return Response.json(
      { error: "Skop tidak sah." },
      { status: 400, headers: NO_STORE },
    );
  }
  if (!allowRequest()) {
    return Response.json(
      { error: "Terlalu banyak permintaan." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": "60" } },
    );
  }
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const body: unknown = await res.json();
    return Response.json(body, {
      status: res.ok ? 200 : 502,
      headers: NO_STORE,
    });
  } catch (error) {
    console.error("[api/waqi]", error);
    return Response.json(
      { error: "Sensor WAQI tidak dapat diambil." },
      { status: 502, headers: NO_STORE },
    );
  }
}
