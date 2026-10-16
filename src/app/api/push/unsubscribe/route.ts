import { deleteRecord } from "@/lib/push-store";
import { isPushServiceEndpoint } from "@/lib/push-validate";
import { isCrossSite, readJsonBody } from "@/lib/request-guard";

/** POST /api/push/unsubscribe — padam langganan. Badan: { endpoint }. */
export async function POST(request: Request) {
  if (isCrossSite(request)) {
    return Response.json({ error: "Tidak dibenarkan." }, { status: 403 });
  }
  const body = await readJsonBody(request, 2048);
  const endpoint = body.ok
    ? (body.value as { endpoint?: unknown } | null)?.endpoint
    : undefined;
  if (!isPushServiceEndpoint(endpoint)) {
    return Response.json({ error: "Endpoint tidak sah." }, { status: 400 });
  }
  try {
    await deleteRecord(endpoint);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/push/unsubscribe]", error);
    return Response.json(
      { error: "Langganan tidak dapat dipadam." },
      { status: 500 },
    );
  }
}
