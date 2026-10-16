/**
 * Fon Plus Jakarta Sans untuk imej next/og (v0.7.15): tanpanya Satori hanya ada fon biasa
 * dan huruf tebal diabaikan. Fail statik dalam `public/` diambil melalui asal permintaan
 * (sama seperti bendera), dicache dalam proses. Gagal = fon lalai.
 */
const WEIGHTS = [
  [400, "Regular"],
  [600, "SemiBold"],
  [700, "Bold"],
  [800, "ExtraBold"],
] as const;

export const OG_FONT_FAMILY = "Jakarta";

type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700 | 800;
  style: "normal";
};

let cache: Promise<OgFont[]> | null = null;

export function ogFonts(requestUrl: string): Promise<OgFont[]> {
  cache ??= Promise.all(
    WEIGHTS.map(async ([weight, file]) => {
      const res = await fetch(
        new URL(`/fonts/PlusJakartaSans-${file}.ttf`, requestUrl),
        { signal: AbortSignal.timeout(3000) },
      );
      if (!res.ok) throw new Error(`fon ${file}: ${res.status}`);
      return {
        name: OG_FONT_FAMILY,
        data: await res.arrayBuffer(),
        weight,
        style: "normal" as const,
      };
    }),
  ).catch(() => {
    cache = null;
    return [];
  });
  return cache;
}
