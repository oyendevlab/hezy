import { deleteRecord } from "@/lib/push-store";

/** POST /api/push/unsubscribe — padam langganan. Badan: { endpoint }. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    endpoint?: unknown;
  } | null;
  if (
    typeof body?.endpoint !== "string" ||
    !body.endpoint.startsWith("https://")
  ) {
    return Response.json({ error: "Endpoint tidak sah." }, { status: 400 });
  }
  try {
    await deleteRecord(body.endpoint);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/push/unsubscribe]", error);
    return Response.json(
      { error: "Langganan tidak dapat dipadam." },
      { status: 500 },
    );
  }
}
