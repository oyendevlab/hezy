import { mergeRecord } from "@/lib/push-record";
import { readRecord, saveRecord } from "@/lib/push-store";
import { parseSubscribeBody } from "@/lib/push-validate";

/** POST /api/push/subscribe — simpan atau kemas kini langganan amaran IPU (lokasi semasa + kegemaran). */
export async function POST(request: Request) {
  const parsed = parseSubscribeBody(await request.json().catch(() => null));
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
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
