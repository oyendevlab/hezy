import { addDays } from "@/lib/history";
import { errorsFor, pruneErrors } from "@/lib/history-store";
import { localHourKey } from "@/lib/reading";
import { isCronAuthorized } from "@/lib/request-guard";

/** Log disimpan 14 hari. */
const KEEP_DAYS = 14;

/**
 * GET /api/log/summary — ringkasan ralat klien semalam dan hari ini untuk pemantauan harian
 * (Authorization: Bearer CRON_SECRET). Turut memadam log lama.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "Belum dikonfigurasi." }, { status: 503 });
  }
  if (!isCronAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Tidak dibenarkan." }, { status: 401 });
  }
  const today = localHourKey(new Date()).slice(0, 10);
  const yesterday = addDays(today, -1);
  const [a, b, pruned] = await Promise.all([
    errorsFor(yesterday),
    errorsFor(today),
    pruneErrors(addDays(today, -KEEP_DAYS)),
  ]);
  const records = [...a, ...b].sort((x, y) => y.count - x.count);
  return Response.json({
    from: yesterday,
    unique: records.length,
    total: records.reduce((n, r) => n + r.count, 0),
    pruned,
    top: records.slice(0, 10).map((r) => ({
      kind: r.kind,
      message: r.message,
      count: r.count,
      path: r.path,
      version: r.version,
      browser: r.browser,
      lastSeen: r.lastSeen,
      frame: r.stack.split("\n").find((l) => l.includes("/_next/")) ?? "",
    })),
  });
}
