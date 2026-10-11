import { parseSubscribeBody } from "@/lib/push-validate";
import { readRecord, saveRecord } from "@/lib/push-store";

/** POST /api/push/subscribe — simpan atau kemas kini langganan amaran IPU. */
export async function POST(request: Request) {
  const parsed = parseSubscribeBody(await request.json().catch(() => null));
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const existing = await readRecord(parsed.value.subscription.endpoint);
    await saveRecord({
      ...parsed.value,
      // Kekalkan status amaran supaya menukar lokasi tidak menghantar amaran berganda.
      lastAlertKey: existing?.lastAlertKey ?? null,
      lastAlertAt: existing?.lastAlertAt ?? null,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/push/subscribe]", error);
    return Response.json(
      { error: "Langganan tidak dapat disimpan. Cuba lagi." },
      { status: 500 },
    );
  }
}
