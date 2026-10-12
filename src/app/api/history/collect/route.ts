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
const MAX_DAYS = 8;

/**
 * GET /api/history/collect?days=2 — dipanggil oleh GitHub Actions (Authorization: Bearer CRON_SECRET).
 * Simpan IPU sejam semua stesen APIMS bagi `days` hari terakhir (termasuk hari ini setakat ini)
 * dan kemas kini indeks harian untuk heatmap.
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

  const requested = Number(new URL(request.url).searchParams.get("days"));
  const days = Number.isInteger(requested)
    ? Math.min(Math.max(requested, 1), MAX_DAYS)
    : 2;
  const now = new Date();
  const nowKey = localHourKey(now);
  const today = nowKey.slice(0, 10);

  let index = await readIndex();
  const summary: { date: string; stations: number; failedStates: number }[] =
    [];

  for (let back = days - 1; back >= 0; back--) {
    const date = addDays(today, -back);
    const hourKey = date === today ? nowKey : `${date}T23:00`;
    const results = await Promise.allSettled(
      STATES.map((s) => fetchStateHourly(s.apimsStateId, hourKey)),
    );
    const existing = await readHourlyDay(date);
    const stations: Record<string, DayHours> = { ...existing?.stations };
    let failedStates = 0;
    for (const result of results) {
      if (result.status === "rejected") {
        failedStates++;
        console.error("[api/history/collect]", date, result.reason);
        continue;
      }
      for (const [id, history] of result.value) {
        stations[id] = mergeHours(stations[id], hoursForDate(history, date));
      }
    }
    if (failedStates < STATES.length) {
      const day = { date, stations };
      await writeHourlyDay(day);
      index = updateIndex(index, day, now);
    }
    summary.push({
      date,
      stations: Object.keys(stations).length,
      failedStates,
    });
  }

  if (index) await writeIndex(index);
  const failed = summary.filter((d) => d.failedStates === STATES.length).length;
  return Response.json({ days: summary, failed });
}
