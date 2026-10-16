import {
  estimateErrors,
  estimateHours,
  forecastErrors,
  forecastHours,
  mergeAccuracy,
  type ForecastSnapshot,
  type StationAccuracy,
} from "@/lib/accuracy";
import type { HourlyOfficial, Station } from "@/lib/apims";
import { fetchStateHourly, getStations } from "@/lib/data";
import { addDays, type DayHours } from "@/lib/history";
import {
  readAccuracy,
  readForecast,
  readHourlyDay,
  writeAccuracy,
  writeForecast,
} from "@/lib/history-store";
import {
  airQualityMultiUrl,
  parseAirQualityMulti,
  type AirQualitySeries,
} from "@/lib/openmeteo";
import { localHourKey } from "@/lib/reading";
import { isCronAuthorized } from "@/lib/request-guard";

/** Hari lepas yang dinilai untuk ketepatan anggaran (data sejarah APIMS ~7 hari). */
const ESTIMATE_BACK_DAYS = 7;
const CHUNK = 25;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function modelSeries(stations: Station[]): Promise<AirQualitySeries[]> {
  const out: AirQualitySeries[] = [];
  for (let i = 0; i < stations.length; i += CHUNK) {
    const res = await fetch(
      airQualityMultiUrl(
        stations.slice(i, i + CHUNK),
        ESTIMATE_BACK_DAYS + 1,
        3,
      ),
      { cache: "no-store", signal: AbortSignal.timeout(20_000) },
    );
    if (!res.ok) throw new Error(`Open-Meteo memulangkan status ${res.status}`);
    out.push(...parseAirQualityMulti(await res.json()));
  }
  return out;
}

/** Sejarah rasmi 25 jam terkini bagi semua stesen (negeri satu demi satu, elak HTTP 429). */
async function officialHistory(
  stations: Station[],
  nowKey: string,
): Promise<Map<string, HourlyOfficial[]>> {
  const all = new Map<string, HourlyOfficial[]>();
  const stateIds = [
    ...new Set(
      stations.map((s) => s.stateId).filter((id): id is number => id !== null),
    ),
  ];
  for (const [i, stateId] of stateIds.entries()) {
    if (i > 0) await sleep(500);
    try {
      for (const [id, h] of await fetchStateHourly(stateId, nowKey))
        all.set(id, h);
    } catch (error) {
      console.error("[api/accuracy/run] APIMS", stateId, error);
    }
  }
  return all;
}

/**
 * GET /api/accuracy/run — sekali sehari (malam) oleh Vercel Cron (Bearer CRON_SECRET); GitHub
 * Actions memanggil dengan `?ifStale=20` sebagai sandaran (dilangkau jika indeks sudah baru).
 * 1. Ketepatan anggaran 7 hari lepas (model vs sejarah APIMS yang disimpan).
 * 2. Ketepatan ramalan semalam (ramalan yang disimpan malam kelmarin vs bacaan sebenar).
 * 3. Simpan ramalan esok (model asal + dibetulkan) untuk dinilai lusa.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "Belum dikonfigurasi." }, { status: 503 });
  }
  if (!isCronAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Tidak dibenarkan." }, { status: 401 });
  }

  const ifStale = Number(new URL(request.url).searchParams.get("ifStale"));
  if (Number.isFinite(ifStale) && ifStale > 0) {
    const current = await readAccuracy();
    if (
      current &&
      Date.now() - Date.parse(current.updatedAt) < ifStale * 3_600_000
    ) {
      return Response.json({ skipped: true, updatedAt: current.updatedAt });
    }
  }

  const now = new Date();
  const nowKey = localHourKey(now);
  const today = nowKey.slice(0, 10);
  const stations = (await getStations()).filter(
    (s) => s.stateId !== null && Number.isFinite(s.lat),
  );
  const series = await modelSeries(stations);
  let index = await readAccuracy();
  const report: Record<string, unknown> = {};

  // 1. Anggaran: hari lengkap sebelum hari ini.
  for (let back = ESTIMATE_BACK_DAYS; back >= 1; back--) {
    const date = addDays(today, -back);
    const actual = await readHourlyDay(date);
    if (!actual) continue;
    const estimates: Record<string, DayHours> = {};
    stations.forEach((s, i) => {
      estimates[s.id] = estimateHours(series[i], date);
    });
    const errors = estimateErrors(estimates, actual);
    const patch: Record<string, StationAccuracy> = {};
    for (const [id, e] of Object.entries(errors)) patch[id] = { e };
    index = mergeAccuracy(index, date, patch, now);
    report[`estimate:${date}`] = Object.keys(errors).length;
  }

  // 2. Ramalan semalam.
  const yesterday = addDays(today, -1);
  const [snapshot, actualYesterday] = await Promise.all([
    readForecast(yesterday),
    readHourlyDay(yesterday),
  ]);
  if (snapshot && actualYesterday) {
    const errors = forecastErrors(snapshot, actualYesterday);
    index = mergeAccuracy(index, yesterday, errors, now);
    report[`forecast:${yesterday}`] = Object.keys(errors).length;
  }

  // 3. Simpan ramalan esok.
  const tomorrow = addDays(today, 1);
  const history = await officialHistory(stations, nowKey);
  const next: ForecastSnapshot = {
    date: tomorrow,
    madeAt: now.toISOString(),
    stations: {},
  };
  stations.forEach((s, i) => {
    next.stations[s.id] = forecastHours(
      series[i],
      history.get(s.id) ?? [],
      nowKey,
      tomorrow,
    );
  });
  await writeForecast(next);
  report[`snapshot:${tomorrow}`] = stations.length;

  if (index) await writeAccuracy(index);
  return Response.json(report);
}
