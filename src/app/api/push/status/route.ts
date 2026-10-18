import { connection } from "next/server";
import { readCheckStatus } from "@/lib/push-store";

/**
 * GET /api/push/status — masa larian semakan amaran terakhir (v0.8.14) untuk pemantauan
 * (`scripts/monitor.mjs`). Tiada maklumat langganan; dicache 60 s di CDN.
 */
export async function GET() {
  await connection();
  try {
    const status = await readCheckStatus();
    return Response.json(
      {
        checkedAt: status?.checkedAt ?? null,
        processedAt: status?.processedAt ?? null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("[api/push/status]", error);
    return Response.json(
      { error: "Status semakan tidak dapat dibaca." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
