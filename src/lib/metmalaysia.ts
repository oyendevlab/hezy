/**
 * Amaran dan ramalan rasmi MetMalaysia (v0.8.6, docs/AUDIT-0.8.md D3) daripada api.data.gov.my
 * (data terbuka, tanpa kunci; had 4 permintaan/minit). Bentuk respons disahkan setiap kali dibaca.
 * - Amaran: hanya amaran darat yang masih sah (ribut petir, hujan lebat, dsb.); amaran laut dan
 *   "Tiada Nasihat" diabaikan. Teks disenaraikan ikut negeri dipisah "•", jadi hanya bahagian
 *   negeri pengguna (dengan daerahnya) dipaparkan.
 * - Ramalan (v0.8.11): kawasan tanah tinggi (pusat rekreasi), kemudian daerah (sempadan
 *   `places.ts`), kemudian negeri — pagi, petang, malam, suhu min–maks hingga 7 hari.
 */

import { HIGHLANDS, highlandAt } from "./highlands";
import type { Place } from "./places";

export const MET_WARNING_URL = "https://api.data.gov.my/weather/warning/";
/**
 * Semua lokasi ramalan dalam satu permintaan (~3,100 baris, ~900 KB): negeri, daerah, bandar
 * dan pusat rekreasi. Dibaca melalui /api/met (CDN 15 min) supaya had kadar tidak dilanggar.
 */
export const MET_FORECAST_URL =
  "https://api.data.gov.my/weather/forecast/?limit=5000";

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

/** Amaran + ramalan yang digunakan, seperti dipulangkan oleh /api/met (v0.8.11). */
export type MetBundle = {
  warnings: MetWarningRaw[];
  forecasts: Record<string, MetDay[]>;
  /** Masa salinan dibina (ISO). */
  fetchedAt: string;
};

/** Respons /api/met (milik Hezy, jadi semakan bentuk ringkas sahaja). */
export function parseMetBundle(json: unknown): MetBundle {
  const b = json as Partial<MetBundle> | null;
  if (
    !b ||
    !Array.isArray(b.warnings) ||
    typeof b.forecasts !== "object" ||
    b.forecasts === null ||
    typeof b.fetchedAt !== "string"
  )
    throw new Error("Respons /api/met tidak dijangka.");
  return b as MetBundle;
}

/** Peringkat ramalan: kawasan tanah tinggi, daerah atau negeri. */
export type MetAreaKind = "zone" | "district" | "state";

export type MetReading = {
  /** Id negeri Hezy yang dipadankan. */
  state: string;
  /** Lokasi ramalan yang digunakan (v0.8.11); tiada dalam bacaan lama = negeri. */
  area?: { kind: MetAreaKind; name: string };
  warnings: MetWarning[];
  /** Ramalan rasmi, hari ini dan seterusnya. */
  forecast: MetDay[];
};

export type MetTarget = {
  state: string;
  /** Lokasi ramalan ikut keutamaan; yang pertama ada data digunakan. */
  sources: readonly { id: string; kind: MetAreaKind; name: string }[];
};

/** Lokasi ramalan bagi titik: tanah tinggi terdekat, daerah, kemudian negeri. */
export function metTargetFor(
  point: { lat: number; lon: number },
  place: Place,
  stateName: string,
): MetTarget | null {
  const meta = MET_STATES[place.state];
  if (!meta) return null;
  const zone = highlandAt(point);
  return {
    state: place.state,
    sources: [
      ...(zone?.met
        ? [{ id: zone.met, kind: "zone" as const, name: zone.name }]
        : []),
      ...(place.met
        ? [{ id: place.met, kind: "district" as const, name: place.district }]
        : []),
      { id: meta.forecastId, kind: "state" as const, name: stateName },
    ],
  };
}

/** Lokasi ramalan yang Hezy gunakan sahaja (negeri, daerah, zon, bandar Tn141 Lojing). */
export function isUsedForecastId(id: string): boolean {
  return (
    id.startsWith("St") ||
    id.startsWith("Ds") ||
    id === "Tn141" ||
    HIGHLANDS.some((h) => h.met === id)
  );
}

/** Ramalan yang digunakan sahaja, dari `today` ke hadapan (respons /api/met lebih kecil). */
export function pickForecasts(
  all: Readonly<Record<string, MetDay[]>>,
  today: string,
): Record<string, MetDay[]> {
  const out: Record<string, MetDay[]> = {};
  for (const [id, days] of Object.entries(all)) {
    if (!isUsedForecastId(id)) continue;
    const upcoming = days.filter((d) => d.date >= today);
    if (upcoming.length) out[id] = upcoming;
  }
  return out;
}

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

/**
 * Amaran negeri dan ramalan lokasi pertama dalam `target.sources` yang ada data, pada `nowKey`
 * (`YYYY-MM-DDTHH:mm`).
 */
export function metFor(
  target: MetTarget,
  warnings: readonly MetWarningRaw[],
  forecasts: Readonly<Record<string, MetDay[]>>,
  nowKey: string,
): MetReading | null {
  const { state } = target;
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
  const today = now.slice(0, 10);
  for (const source of target.sources) {
    const forecast = (forecasts[source.id] ?? []).filter(
      (d) => d.date >= today,
    );
    if (forecast.length)
      return {
        state,
        area: { kind: source.kind, name: source.name },
        warnings: active,
        forecast,
      };
  }
  return { state, warnings: active, forecast: [] };
}

export type MetKind = "storm" | "rain" | "dry" | "haze" | "other";

export type MetCondition = {
  kind: MetKind;
  /** Label pendek (kunci terjemahan BM), cth. "Ribut petir". */
  main: string;
  /** Kelayakan (kunci terjemahan BM), cth. ["kebanyakan tempat", "pedalaman"]. */
  qualifiers: string[];
};

/**
 * Frasa ramalan MetMalaysia → jenis, label pendek dan kelayakan (v0.8.9), cth.
 * "Ribut petir di kebanyakan tempat di kawasan pedalaman" → ribut petir, ["kebanyakan tempat",
 * "pedalaman"]. Frasa yang tidak dikenali dipaparkan seperti asal.
 */
export function metCondition(phrase: string): MetCondition {
  const text = phrase.trim();
  const lower = text.toLowerCase();
  const qualifiers: string[] = [];
  if (lower.includes("menyeluruh")) qualifiers.push("menyeluruh");
  if (lower.includes("kebanyakan tempat")) qualifiers.push("kebanyakan tempat");
  else if (lower.includes("beberapa tempat"))
    qualifiers.push("beberapa tempat");
  else if (lower.includes("satu dua tempat"))
    qualifiers.push("satu dua tempat");
  if (lower.includes("kawasan pantai")) qualifiers.push("pantai");
  if (lower.includes("kawasan pedalaman")) qualifiers.push("pedalaman");
  if (lower.startsWith("ribut petir"))
    return { kind: "storm", main: "Ribut petir", qualifiers };
  if (lower.startsWith("tiada hujan"))
    return { kind: "dry", main: "Tiada hujan", qualifiers: [] };
  if (lower.startsWith("hujan"))
    return { kind: "rain", main: "Hujan", qualifiers };
  if (lower.startsWith("jerebu") || lower.startsWith("berjerebu"))
    return { kind: "haze", main: "Jerebu", qualifiers };
  return { kind: "other", main: text, qualifiers: [] };
}

/** Ramalan MetMalaysia bagi tarikh `date`, jika ada. */
export function metDayFor(
  forecast: readonly MetDay[] | undefined,
  date: string,
): MetDay | undefined {
  return forecast?.find((d) => d.date === date);
}
