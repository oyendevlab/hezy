import { isLang, type Lang } from "./i18n";
import { parseShare, type ShareData } from "./share";

export type CardFormat = "square" | "story";

export const CARD_SIZE: Record<CardFormat, { width: number; height: number }> =
  {
    square: { width: 1080, height: 1080 },
    story: { width: 1080, height: 1920 },
  };

export type CardData = ShareData & {
  /** IPU 24 jam hari ini (rasmi/anggaran untuk jam lepas, ramalan selepas). */
  hours: (number | null)[];
  /** Indeks jam semasa dalam `hours`; selepasnya ialah ramalan. */
  now: number;
  /** Masa bacaan, cth. "12:00 tengah hari". */
  time: string;
  lang: Lang;
  format: CardFormat;
};

/** Laluan imej kad kongsi, cth. `/kongsi/kad?n=Putrajaya&i=153&s=apims&h=88,90,…&k=12&t=…&l=ms&f=story`. */
export function buildCardPath(data: {
  name: string;
  ipu: number;
  source: "apims" | "model";
  hours: readonly (number | null)[];
  now: number;
  time: string;
  lang: Lang;
  format: CardFormat;
  state?: string | null;
}): string {
  const params = new URLSearchParams({
    n: data.name.slice(0, 40),
    i: String(Math.round(data.ipu)),
    s: data.source,
    h: data.hours
      .slice(0, 24)
      .map((v) => (v === null ? "-" : String(Math.round(v))))
      .join(","),
    k: String(data.now),
    t: data.time.slice(0, 30),
    l: data.lang,
    f: data.format,
  });
  if (data.state) params.set("g", data.state);
  return `/kongsi/kad?${params}`;
}

/** Sahkan parameter kad. Nilai yang rosak diabaikan (graf kosong) dan bukan ralat. */
export function parseCard(
  params: Record<string, string | string[] | undefined>,
): CardData | null {
  const base = parseShare(params);
  if (!base) return null;
  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) ?? "";
  const hours = one(params.h)
    .split(",")
    .slice(0, 24)
    .map((v) => {
      const n = Number(v);
      return v !== "" && Number.isInteger(n) && n >= 0 && n <= 999 ? n : null;
    });
  const now = Number(one(params.k));
  const lang = one(params.l);
  return {
    ...base,
    hours: hours.some((v) => v !== null) ? hours : [],
    now: Number.isInteger(now) && now >= 0 && now < 24 ? now : -1,
    time: one(params.t)
      .replace(/[^\p{L}\p{N} :.]/gu, "")
      .trim()
      .slice(0, 30),
    lang: isLang(lang) ? lang : "ms",
    format: one(params.f) === "story" ? "story" : "square",
  };
}
