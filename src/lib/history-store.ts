import { createHash } from "node:crypto";
import { del, get, list, put } from "@vercel/blob";
import type { AccuracyIndex, ForecastSnapshot } from "./accuracy";
import type { ErrorRecord } from "./error-log";
import type { DailyIndex, HourlyDay } from "./history";

const INDEX_PATH = "history/daily.json";
const hourlyPath = (date: string) => `history/hourly/${date}.json`;

async function readJson<T>(path: string): Promise<T | null> {
  const result = await get(path, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return (await new Response(result.stream).json()) as T;
}

async function writeJson(path: string, data: unknown) {
  await put(path, JSON.stringify(data), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export const readIndex = () => readJson<DailyIndex>(INDEX_PATH);
export const writeIndex = (index: DailyIndex) => writeJson(INDEX_PATH, index);
export const readHourlyDay = (date: string) =>
  readJson<HourlyDay>(hourlyPath(date));
export const writeHourlyDay = (day: HourlyDay) =>
  writeJson(hourlyPath(day.date), day);

const ACCURACY_PATH = "accuracy/index.json";
const forecastPath = (date: string) => `accuracy/forecast/${date}.json`;

export const readAccuracy = () => readJson<AccuracyIndex>(ACCURACY_PATH);
export const writeAccuracy = (index: AccuracyIndex) =>
  writeJson(ACCURACY_PATH, index);
export const readForecast = (date: string) =>
  readJson<ForecastSnapshot>(forecastPath(date));
export const writeForecast = (snapshot: ForecastSnapshot) =>
  writeJson(forecastPath(snapshot.date), snapshot);

// --- Log ralat klien (item 13): `logs/<tarikh>/<cap jari>.json` ---

const errorPath = (date: string, fingerprint: string) =>
  `logs/${date}/${createHash("sha256").update(fingerprint).digest("hex").slice(0, 24)}.json`;

export const readError = (date: string, fingerprint: string) =>
  readJson<ErrorRecord>(errorPath(date, fingerprint));
export const writeError = (
  date: string,
  fingerprint: string,
  record: ErrorRecord,
) => writeJson(errorPath(date, fingerprint), record);

/** Semua rekod ralat bagi satu tarikh. */
export async function errorsFor(date: string): Promise<ErrorRecord[]> {
  const { blobs } = await list({ prefix: `logs/${date}/`, limit: 1000 });
  const records = await Promise.all(
    blobs.map((b) => readJson<ErrorRecord>(b.pathname)),
  );
  return records.filter((r): r is ErrorRecord => r !== null);
}

/** Padam log lebih lama daripada `beforeDate` (YYYY-MM-DD). */
export async function pruneErrors(beforeDate: string): Promise<number> {
  const { blobs } = await list({ prefix: "logs/", limit: 1000 });
  const old = blobs
    .filter((b) => b.pathname.slice(5, 15) < beforeDate)
    .map((b) => b.url);
  if (old.length) await del(old);
  return old.length;
}
