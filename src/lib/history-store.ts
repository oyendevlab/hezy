import { get, put } from "@vercel/blob";
import type { AccuracyIndex, ForecastSnapshot } from "./accuracy";
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
