import { deleteRecord, readRecord } from "@/lib/push-store";
import { isPushServiceEndpoint } from "@/lib/push-validate";
import { isCrossSite, readJsonBody } from "@/lib/request-guard";
import {
  TEST_MAX_PER_MINUTE,
  cooldownSeconds,
  testPayload,
} from "@/lib/push-test";
import { WebPushError, webpush } from "@/lib/web-push";

// Had kadar dalam memori (setiap instans): kasar tetapi cukup untuk butang ujian.
const lastSent = new Map<string, number>();
const MAX_BODY_BYTES = 2048;
let windowStart = 0;
let windowCount = 0;

/**
 * POST /api/push/test — hantar satu notifikasi ujian ke peranti ini. Badan: { endpoint }.
 * Hanya untuk langganan yang sudah disimpan (bukan endpoint sebarangan); tidak mengubah
 * status amaran atau rekod langganan.
 */
export async function POST(request: Request) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return Response.json(
      { error: "Notifikasi belum dikonfigurasi." },
      { status: 503 },
    );
  }
  if (isCrossSite(request)) {
    return Response.json({ error: "Tidak dibenarkan." }, { status: 403 });
  }
  const body = await readJsonBody(request, MAX_BODY_BYTES);
  const endpoint = body.ok
    ? (body.value as { endpoint?: unknown } | null)?.endpoint
    : undefined;
  if (!isPushServiceEndpoint(endpoint)) {
    return Response.json({ error: "Endpoint tidak sah." }, { status: 400 });
  }

  const now = Date.now();
  const wait = cooldownSeconds(lastSent.get(endpoint), now);
  if (now - windowStart > 60_000) {
    windowStart = now;
    windowCount = 0;
  }
  if (wait > 0 || windowCount >= TEST_MAX_PER_MINUTE) {
    const retryAfter = wait || 60;
    return Response.json(
      { error: "Tunggu sebentar sebelum menghantar lagi.", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  try {
    const record = await readRecord(endpoint);
    if (!record) {
      return Response.json(
        {
          error:
            "Langganan tidak dijumpai. Matikan dan hidupkan semula amaran.",
        },
        { status: 404 },
      );
    }
    windowCount++;
    lastSent.set(endpoint, now);
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "https://hezy.my",
      publicKey,
      privateKey,
    );
    await webpush.sendNotification(
      record.subscription,
      JSON.stringify(testPayload(record.lang ?? "ms")),
      { TTL: 300, urgency: "normal" },
    );
    return Response.json({ ok: true });
  } catch (error) {
    if (
      error instanceof WebPushError &&
      (error.statusCode === 404 || error.statusCode === 410)
    ) {
      // Langganan tamat di peranti: buang rekod supaya pengguna boleh melanggan semula.
      await deleteRecord(endpoint).catch(() => undefined);
      return Response.json(
        { error: "Langganan sudah tamat. Matikan dan hidupkan semula amaran." },
        { status: 410 },
      );
    }
    console.error("[api/push/test]", error);
    return Response.json(
      { error: "Notifikasi ujian tidak dapat dihantar. Cuba lagi." },
      { status: 500 },
    );
  }
}
