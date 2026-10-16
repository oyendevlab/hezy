import { mergeRecord } from "@/lib/push-record";
import { readRecord, saveRecord } from "@/lib/push-store";
import { parseSubscribeBody } from "@/lib/push-validate";
import {
  createWindowLimiter,
  isCrossSite,
  readJsonBody,
} from "@/lib/request-guard";

/** Badan sah (6 lokasi + pilihan) jauh di bawah had ini. */
const MAX_BODY_BYTES = 8192;
/** Had tulisan setiap instans fungsi seminit (perlindungan kasar daripada banjir rekod). */
const allowWrite = createWindowLimiter(20);

/** POST /api/push/subscribe — simpan atau kemas kini langganan amaran IPU (lokasi semasa + kegemaran). */
export async function POST(request: Request) {
  if (isCrossSite(request)) {
    return Response.json({ error: "Tidak dibenarkan." }, { status: 403 });
  }
  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) {
    return Response.json(
      { error: "Langganan notifikasi tidak sah." },
      { status: body.status },
    );
  }
  const parsed = parseSubscribeBody(body.value);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  if (!allowWrite()) {
    return Response.json(
      { error: "Terlalu banyak permintaan. Cuba lagi sebentar." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  try {
    const existing = await readRecord(parsed.value.subscription.endpoint);
    // Status amaran dikekalkan bagi lokasi yang sama supaya amaran tidak berganda.
    await saveRecord(mergeRecord(parsed.value, existing, new Date()));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/push/subscribe]", error);
    return Response.json(
      { error: "Langganan tidak dapat disimpan. Cuba lagi." },
      { status: 500 },
    );
  }
}
