/**
 * Sejarah IPU rasmi APIMS. Endpoint APIMS hanya menyimpan ~7 hari, jadi Hezy mengumpul
 * IPU sejam setiap stesen ke Vercel Blob (tugas berjadual) dan meringkaskannya setiap hari.
 */

import type { HourlyOfficial } from "./apims";

/** IPU sejam bagi satu tarikh: indeks 0–23 = jam 00:00–23:00 waktu Malaysia. */
export type DayHours = (number | null)[];

/** Fail `history/hourly/<tarikh>.json`. */
export type HourlyDay = { date: string; stations: Record<string, DayHours> };

/** Ringkasan sehari bagi satu stesen: [maks, purata, bilangan jam]. */
export type DaySummary = [max: number, avg: number, hours: number];

/** Fail `history/daily.json`: tarikh → stesen → ringkasan. */
export type DailyIndex = {
  updatedAt: string;
  days: Record<string, Record<string, DaySummary>>;
};

/** Bilangan hari disimpan dalam indeks harian (~13 bulan). */
export const KEEP_DAYS = 400;

/** Bilangan hari untuk heatmap (12 minggu). */
export const HEATMAP_DAYS = 84;

/** Hari untuk heatmap: tarikh dan ringkasan (atau tiada data). */
export type HistoryDay = {
  date: string;
  max: number | null;
  avg: number | null;
  hours: number;
};

const emptyDay = (): DayHours => Array.from({ length: 24 }, () => null);

/** Susun sejarah 25 jam APIMS ke dalam jam bagi `date` sahaja. */
export function hoursForDate(
  history: readonly HourlyOfficial[],
  date: string,
): DayHours {
  const hours = emptyDay();
  for (const h of history) {
    if (h.time.slice(0, 10) !== date || h.ipu === null) continue;
    hours[Number(h.time.slice(11, 13))] = h.ipu;
  }
  return hours;
}

/** Gabung jam baharu dengan yang sedia ada; nilai sedia ada tidak ditimpa dengan `null`. */
export function mergeHours(
  existing: DayHours | undefined,
  next: DayHours,
): DayHours {
  return next.map((v, i) => v ?? existing?.[i] ?? null);
}

export function summarize(hours: DayHours): DaySummary | null {
  const values = hours.filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return [
    Math.max(...values),
    Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    values.length,
  ];
}

/** Kemas kini indeks harian dengan satu hari dan buang tarikh lebih lama daripada {@link KEEP_DAYS}. */
export function updateIndex(
  index: DailyIndex | null,
  day: HourlyDay,
  now: Date,
): DailyIndex {
  const summaries: Record<string, DaySummary> = {};
  for (const [id, hours] of Object.entries(day.stations)) {
    const s = summarize(hours);
    if (s) summaries[id] = s;
  }
  const days = { ...(index?.days ?? {}), [day.date]: summaries };
  const cutoff = addDays(day.date, -KEEP_DAYS);
  for (const date of Object.keys(days)) if (date <= cutoff) delete days[date];
  return { updatedAt: now.toISOString(), days };
}

/** Tambah `n` hari pada tarikh `YYYY-MM-DD`. */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Sejarah satu stesen bagi `count` hari berakhir pada `today`. */
export function stationHistory(
  index: DailyIndex | null,
  stationId: string,
  today: string,
  count: number,
): HistoryDay[] {
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(today, i - count + 1);
    const s = index?.days[date]?.[stationId];
    return s
      ? { date, max: s[0], avg: s[1], hours: s[2] }
      : { date, max: null, avg: null, hours: 0 };
  });
}

/** Tarikh terawal yang mempunyai data bagi stesen (untuk nota "data sejak"). */
export function firstDate(
  index: DailyIndex | null,
  stationId: string,
): string | null {
  const dates = Object.keys(index?.days ?? {})
    .filter((d) => index!.days[d][stationId])
    .sort();
  return dates[0] ?? null;
}

/**
 * Susun hari ke dalam lajur minggu (Isnin–Ahad) seperti graf sumbangan GitHub.
 * Sel sebelum hari pertama atau selepas hari terakhir ialah `null`.
 */
export function toWeeks(days: readonly HistoryDay[]): (HistoryDay | null)[][] {
  if (days.length === 0) return [];
  const dow = (date: string) =>
    (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
  const cells: (HistoryDay | null)[] = [
    ...Array.from({ length: dow(days[0].date) }, () => null),
    ...days,
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) =>
    cells.slice(w * 7, w * 7 + 7),
  );
}

/**
 * Label bulan bagi setiap lajur minggu: pada minggu yang mengandungi hari 1 bulan itu.
 * Minggu pertama dilabel juga jika minggu kedua tiada label (elak label bertindih).
 */
export function monthLabelWeeks(
  weeks: readonly (HistoryDay | null)[][],
): (string | null)[] {
  const labels = weeks.map(
    (week) => week.find((d) => d?.date.endsWith("-01"))?.date ?? null,
  );
  if (labels.length > 0 && labels[0] === null && !labels[1]) {
    labels[0] = weeks[0].find((d) => d)?.date ?? null;
  }
  return labels;
}
