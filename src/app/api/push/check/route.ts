import webpush, { WebPushError } from "web-push";
import { getStations } from "@/lib/data";
import { loadReading } from "@/lib/load-reading";
import { applySent, planNotifications } from "@/lib/push-plan";
import { allRecords, deleteRecord, saveRecord } from "@/lib/push-store";
import type { Reading } from "@/lib/reading";

/**
 * GET /api/push/check — dipanggil setiap jam oleh GitHub Actions (Authorization: Bearer CRON_SECRET).
 * Bagi setiap langganan: amaran ambang (ditangguh semasa waktu senyap), ringkasan pagi
 * dan amaran ramalan esok mengikut pilihan pengguna.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!secret || !publicKey || !privateKey) {
    return Response.json(
      { error: "Notifikasi belum dikonfigurasi." },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Tidak dibenarkan." }, { status: 401 });
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "https://hezy.vercel.app",
    publicKey,
    privateKey,
  );

  const now = new Date();
  const stations = await getStations().catch(() => null);
  const readings = new Map<string, Promise<Reading | null>>();
  const readingFor = (lat: number, lon: number) => {
    const key = `${lat},${lon}`;
    if (!readings.has(key)) {
      readings.set(
        key,
        loadReading({ lat, lon }, now, stations)
          .then((r) => r.reading)
          .catch(() => null),
      );
    }
    return readings.get(key)!;
  };

  const summary = { checked: 0, sent: 0, removed: 0, failed: 0 };
  records: for (const original of await allRecords()) {
    summary.checked++;
    let record = original;
    const list = await Promise.all(
      record.locations.map((l) => readingFor(l.lat, l.lon)),
    );
    for (const note of planNotifications(record, list, now)) {
      try {
        await webpush.sendNotification(
          record.subscription,
          JSON.stringify({
            title: note.title,
            body: note.body,
            url: "/",
            // Tag berasingan supaya amaran satu lokasi tidak menggantikan lokasi lain.
            tag: note.tag,
            lang: record.lang ?? "ms",
            ...(note.badge !== undefined ? { badge: note.badge } : {}),
          }),
          { TTL: 3600, urgency: note.urgency },
        );
        record = applySent(record, note.update, now);
        summary.sent++;
      } catch (error) {
        if (
          error instanceof WebPushError &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          // Langganan sudah tamat atau dibatalkan di peranti.
          await deleteRecord(record.subscription.endpoint);
          summary.removed++;
          continue records;
        }
        console.error("[api/push/check]", error);
        summary.failed++;
      }
    }
    if (record !== original) await saveRecord(record);
  }
  return Response.json(summary);
}
