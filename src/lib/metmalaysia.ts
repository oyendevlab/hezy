/**
 * Amaran dan ramalan rasmi MetMalaysia (v0.8.6, docs/AUDIT-0.8.md D3) daripada api.data.gov.my
 * (data terbuka, tanpa kunci). Bentuk respons disahkan setiap kali dibaca.
 * - Amaran: hanya amaran darat yang masih sah (ribut petir, hujan lebat, dsb.); amaran laut dan
 *   "Tiada Nasihat" diabaikan. Teks disenaraikan ikut negeri dipisah "•", jadi hanya bahagian
 *   negeri pengguna (dengan daerahnya) dipaparkan.
 * - Ramalan: peringkat negeri (pagi, petang, malam, suhu min–maks) hingga 7 hari.
 */

import { distanceKm } from "./apims";
import { findStateByApimsId } from "./areas";

export const MET_WARNING_URL = "https://api.data.gov.my/weather/warning/";
/** Ramalan peringkat negeri sahaja (16 lokasi × 7 hari, ~40 KB). */
export const MET_FORECAST_URL =
  "https://api.data.gov.my/weather/forecast/?contains=St@location__location_id&limit=200";

/** Negeri Hezy (id dalam areas.ts) → lokasi ramalan MetMalaysia dan nama dalam teks amaran. */
export const MET_STATES: Readonly<
  Record<string, { forecastId: string; names: readonly string[] }>
> = {
  perlis: { forecastId: "St001", names: ["Perlis"] },
  kedah: { forecastId: "St002", names: ["Kedah"] },
  "pulau-pinang": { forecastId: "St003", names: ["Pulau Pinang", "Penang"] },
  perak: { forecastId: "St004", names: ["Perak"] },
  kelantan: { forecastId: "St005", names: ["Kelantan"] },
  terengganu: { forecastId: "St006", names: ["Terengganu"] },
  pahang: { forecastId: "St007", names: ["Pahang"] },
  selangor: { forecastId: "St008", names: ["Selangor"] },
  "kuala-lumpur": {
    forecastId: "St009",
    names: ["W.P. Kuala Lumpur", "WP Kuala Lumpur", "Kuala Lumpur"],
  },
  putrajaya: {
    forecastId: "St010",
    names: ["W.P. Putrajaya", "WP Putrajaya", "Putrajaya"],
  },
  "negeri-sembilan": {
    forecastId: "St011",
    names: ["Negeri Sembilan", "N. Sembilan"],
  },
  melaka: { forecastId: "St012", names: ["Melaka", "Malacca"] },
  johor: { forecastId: "St013", names: ["Johor"] },
  sarawak: { forecastId: "St501", names: ["Sarawak"] },
  sabah: { forecastId: "St502", names: ["Sabah"] },
  labuan: {
    forecastId: "St503",
    names: ["W.P. Labuan", "WP Labuan", "Labuan"],
  },
};

export type MetWarningRaw = {
  titleMs: string;
  titleEn: string;
  /** `YYYY-MM-DDTHH:mm` waktu Malaysia. */
  issued: string;
  validFrom: string | null;
  validTo: string | null;
  textMs: string;
  textEn: string;
};

export type MetDay = {
  date: string;
  morning: string;
  afternoon: string;
  night: string;
  summary: string;
  when: string;
  min: number | null;
  max: number | null;
};

export type MetWarning = {
  title: { ms: string; en: string };
  issued: string;
  validFrom: string | null;
  validTo: string;
  /** Bahagian teks bagi negeri pengguna, cth. "Selangor (Gombak dan Hulu Langat)". */
  area: { ms: string; en: string | null };
};

export type MetReading = {
  /** Id negeri Hezy yang dipadankan. */
  state: string;
  warnings: MetWarning[];
  /** Ramalan rasmi peringkat negeri, hari ini dan seterusnya. */
  forecast: MetDay[];
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const time = (v: unknown) =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)
    ? v.slice(0, 16)
    : null;

export function parseWarnings(json: unknown): MetWarningRaw[] {
  if (!Array.isArray(json)) {
    throw new Error("Respons MetMalaysia (amaran) tidak dijangka.");
  }
  return json.flatMap((row): MetWarningRaw[] => {
    const r = row as {
      warning_issue?: {
        issued?: unknown;
        title_bm?: unknown;
        title_en?: unknown;
      };
      valid_from?: unknown;
      valid_to?: unknown;
      text_bm?: unknown;
      text_en?: unknown;
    } | null;
    const issued = time(r?.warning_issue?.issued);
    const titleMs = str(r?.warning_issue?.title_bm);
    if (!issued || !titleMs) return [];
    return [
      {
        titleMs,
        titleEn: str(r?.warning_issue?.title_en) || titleMs,
        issued,
        validFrom: time(r?.valid_from),
        validTo: time(r?.valid_to),
        textMs: str(r?.text_bm),
        textEn: str(r?.text_en),
      },
    ];
  });
}

export function parseForecasts(json: unknown): Record<string, MetDay[]> {
  if (!Array.isArray(json)) {
    throw new Error("Respons MetMalaysia (ramalan) tidak dijangka.");
  }
  const out: Record<string, MetDay[]> = {};
  for (const row of json as {
    location?: { location_id?: unknown };
    date?: unknown;
    morning_forecast?: unknown;
    afternoon_forecast?: unknown;
    night_forecast?: unknown;
    summary_forecast?: unknown;
    summary_when?: unknown;
    min_temp?: unknown;
    max_temp?: unknown;
  }[]) {
    const id = str(row?.location?.location_id);
    const date = str(row?.date);
    if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const num = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) ? v : null;
    (out[id] ??= []).push({
      date,
      morning: str(row.morning_forecast),
      afternoon: str(row.afternoon_forecast),
      night: str(row.night_forecast),
      summary: str(row.summary_forecast),
      when: str(row.summary_when),
      min: num(row.min_temp),
      max: num(row.max_temp),
    });
  }
  for (const days of Object.values(out))
    days.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

/** Amaran laut, nasihat siklon dan "Tiada Nasihat" tidak berkaitan dengan lokasi darat. */
function isLandWarning(w: MetWarningRaw): boolean {
  return (
    w.validTo !== null &&
    !/laut|seas?\b|siklon|cyclone|tiada nasihat|no advisory/i.test(
      `${w.titleMs} ${w.titleEn}`,
    )
  );
}

/** Pecahkan senarai negeri "A (x, y) • B • C: z" selepas "di negeri"/"over the states of". */
export function warningSegments(text: string): string[] {
  const body = text.replace(/^.*?(?:di negeri|over the states? of)\s+/i, "");
  const parts = body.split(/\s*•\s*/).filter(Boolean);
  if (parts.length > 0)
    parts[parts.length - 1] = parts[parts.length - 1].replace(
      /\s+(?:sehingga|until)\s.*$/i,
      "",
    );
  return parts;
}

/** Bahagian amaran bagi negeri, atau null jika negeri tidak disebut. */
function areaFor(
  w: MetWarningRaw,
  names: readonly string[],
): MetWarning["area"] | null {
  const ms = warningSegments(w.textMs);
  const index = ms.findIndex((segment) =>
    names.some(
      (name) =>
        segment === name ||
        segment.startsWith(`${name} `) ||
        segment.startsWith(`${name}:`) ||
        segment.startsWith(`${name}(`),
    ),
  );
  if (index < 0) return null;
  const en = warningSegments(w.textEn);
  return { ms: ms[index], en: en.length === ms.length ? en[index] : null };
}

/** Amaran dan ramalan MetMalaysia bagi negeri `state` pada `nowKey` (`YYYY-MM-DDTHH:mm`). */
export function metFor(
  state: string,
  warnings: readonly MetWarningRaw[],
  forecasts: Readonly<Record<string, MetDay[]>>,
  nowKey: string,
): MetReading | null {
  const meta = MET_STATES[state];
  if (!meta) return null;
  const now = nowKey.slice(0, 16);
  const active = warnings.flatMap((w): MetWarning[] => {
    if (!isLandWarning(w) || (w.validTo as string) <= now) return [];
    const area = areaFor(w, meta.names);
    if (!area) return [];
    return [
      {
        title: { ms: w.titleMs, en: w.titleEn },
        issued: w.issued,
        validFrom: w.validFrom,
        validTo: w.validTo as string,
        area,
      },
    ];
  });
  return {
    state,
    warnings: active,
    forecast: (forecasts[meta.forecastId] ?? []).filter(
      (d) => d.date >= now.slice(0, 10),
    ),
  };
}

/**
 * Negeri bagi amaran MetMalaysia: negeri stesen APIMS terdekat dalam 150 km. Lebih luas daripada
 * bendera kad kongsi (30 km) supaya kawasan jauh dari stesen pun menerima amaran negerinya.
 */
export function metStateFor(
  stations: readonly { lat: number; lon: number; stateId: number | null }[],
  point: { lat: number; lon: number },
): string | null {
  let best: { id: string; d: number } | null = null;
  for (const s of stations) {
    const state = findStateByApimsId(s.stateId);
    if (!state) continue;
    const d = distanceKm(point, s);
    if (d <= 150 && (best === null || d < best.d)) best = { id: state.id, d };
  }
  return best?.id ?? null;
}
