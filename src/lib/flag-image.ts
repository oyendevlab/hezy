import { flagPath } from "./state-flag";

/**
 * Bendera negeri sebagai data URL untuk imej next/og (fail statik dalam `public/` tidak
 * tersedia dalam fungsi pelayan, jadi diambil melalui asal permintaan). `null` jika gagal.
 */
export async function flagDataUrl(
  stateId: string | null | undefined,
  requestUrl: string,
): Promise<string | null> {
  if (!stateId) return null;
  try {
    const res = await fetch(new URL(flagPath(stateId), requestUrl), {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
