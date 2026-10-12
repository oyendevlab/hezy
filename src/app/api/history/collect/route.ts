import { STATES } from "@/lib/areas";
import { fetchStateHourly } from "@/lib/data";
import {
  addDays,
  hoursForDate,
  mergeHours,
  updateIndex,
  type DayHours,
} from "@/lib/history";
import {
  readHourlyDay,
  readIndex,
  writeHourlyDay,
  writeIndex,
} from "@/lib/history-store";
import { localHourKey } from "@/lib/reading";

/** Had hari ke belakang: endpoint APIMS menyimpan ~7 hari. */
const MAX_BACK = 7;
/** Jeda antara permintaan supaya tidak dihadkan oleh APIMS (HTTP 429). */
const GAP_MS = 500;
const RETRIES = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Ambil sejarah satu negeri dengan cubaan semula bila APIMS menghadkan kadar. */
async function fetchPolitely(stateId: number, hourKey: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetchStateHourly(stateId, hourKey);
    } catch (error) {
      if (attempt >= RETRIES) throw error;
      await sleep(2000 * attempt);
    }
  }
}

/**
 * GET /api/history/collect?back=0 — dipanggil oleh GitHub Actions (Authorization: Bearer CRON_SECRET).
 * Simpan IPU sejam semua stesen APIMS bagi satu tarikh (`back` hari sebelum hari ini; 0 = hari ini
 * setakat ini) dan kemas kini indeks harian untuk heatmap. Negeri diminta satu demi satu.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      { error: "Pengumpul sejarah belum dikonfigurasi." },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Tidak dibenarkan." }, { status: 401 });
  }

  const requested = Number(new URL(request.url).searchParams.get("back"));
  const back = Number.isInteger(requested)
    ? Math.min(Math.max(requested, 0), MAX_BACK)
    : 0;
  const now = new Date();
  const nowKey = localHourKey(now);
  const today = nowKey.slice(0, 10);
  const date = addDays(today, -back);
  const hourKey = date === today ? nowKey : `${date}T23:00`;

  const existing = await readHourlyDay(date);
  const stations: Record<string, DayHours> = { ...existing?.stations };
  const failedStates: number[] = [];
  for (const [i, state] of STATES.entries()) {
    if (i > 0) await sleep(GAP_MS);
    try {
      const result = await fetchPolitely(state.apimsStateId, hourKey);
      for (const [id, history] of result) {
        stations[id] = mergeHours(stations[id], hoursForDate(history, date));
      }
    } catch (error) {
      failedStates.push(state.apimsStateId);
      console.error("[api/history/collect]", date, state.id, error);
    }
  }

  const ok = failedStates.length < STATES.length;
  if (ok) {
    const day = { date, stations };
    await writeHourlyDay(day);
    await writeIndex(updateIndex(await readIndex(), day, now));
  }
  return Response.json(
    { date, stations: Object.keys(stations).length, failedStates },
    { status: ok ? 200 : 502 },
  );
}
