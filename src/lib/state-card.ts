import type { Station } from "./apims";
import { findState, type State } from "./areas";
import { isLang, type Lang } from "./i18n";
import type { CardFormat } from "./share-card";

/** Ringkasan satu negeri untuk kad imej negeri (v0.7.0 item 11). */
export type StateSummary = {
  /** Stesen dengan bacaan, IPU menurun. */
  stations: { name: string; ipu: number }[];
  /** Bilangan stesen dengan bacaan melebihi IPU 100. */
  unhealthy: number;
  /** Bacaan terkini, waktu Malaysia `YYYY-MM-DDTHH:mm`. */
  time: string | null;
};

export function summarizeState(
  stations: readonly Station[],
  state: State,
): StateSummary | null {
  const list = stations
    .filter((s) => s.stateId === state.apimsStateId && s.ipu !== null)
    .map((s) => ({ name: s.name, ipu: s.ipu!, time: s.time }))
    .sort((a, b) => b.ipu - a.ipu || a.name.localeCompare(b.name));
  if (list.length === 0) return null;
  const time = list
    .map((s) => s.time ?? "")
    .sort()
    .at(-1);
  return {
    stations: list.map(({ name, ipu }) => ({ name, ipu })),
    unhealthy: list.filter((s) => s.ipu > 100).length,
    time: time || null,
  };
}

export type StateCardParams = { state: State; lang: Lang; format: CardFormat };

/** Laluan imej kad negeri, cth. `/kongsi/negeri?g=selangor&l=ms&f=story`. */
export function buildStateCardPath(
  stateId: string,
  lang: Lang,
  format: CardFormat,
): string {
  return `/kongsi/negeri?${new URLSearchParams({ g: stateId, l: lang, f: format })}`;
}

export function parseStateCard(
  params: Record<string, string | string[] | undefined>,
): StateCardParams | null {
  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) ?? "";
  const state = findState(one(params.g));
  if (!state) return null;
  const lang = one(params.l);
  return {
    state,
    lang: isLang(lang) ? lang : "ms",
    format: one(params.f) === "story" ? "story" : "square",
  };
}
