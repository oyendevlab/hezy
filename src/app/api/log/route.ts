import {
  MAX_BODY_BYTES,
  fingerprintSource,
  mergeError,
  parseReport,
} from "@/lib/error-log";
import { readError, writeError } from "@/lib/history-store";
import { localHourKey } from "@/lib/reading";
import { createWindowLimiter, isCrossSite } from "@/lib/request-guard";

/** Had tulisan setiap instans fungsi seminit (perlindungan kasar daripada banjir). */
const allowWrite = createWindowLimiter(30);

/** POST /api/log — laporan ralat klien (tanpa data peribadi). Sentiasa 204 kecuali input rosak. */
export async function POST(request: Request) {
  if (isCrossSite(request)) return new Response(null, { status: 403 });
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const report = parseReport(body);
  if (!report) return new Response(null, { status: 400 });

  const now = new Date();
  if (!allowWrite(now.getTime())) return new Response(null, { status: 204 });

  try {
    const date = localHourKey(now).slice(0, 10);
    const fingerprint = fingerprintSource(report);
    const existing = await readError(date, fingerprint);
    await writeError(date, fingerprint, mergeError(existing, report, now));
  } catch (error) {
    console.error("[api/log]", error);
  }
  return new Response(null, { status: 204 });
}
