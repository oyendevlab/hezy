import webpush, { WebPushError } from "web-push";
import { decideAlert } from "@/lib/alert";
import { getAirQuality, getStations } from "@/lib/data";
import {
  officialFor,
  primaryReading,
  type PrimaryReading,
} from "@/lib/official";
import { allRecords, deleteRecord, saveRecord } from "@/lib/push-store";
import { buildReading, localHourKey } from "@/lib/reading";

/**
 * GET /api/push/check — dipanggil setiap jam oleh GitHub Actions (Authorization: Bearer CRON_SECRET).
 * Menyemak IPU bagi setiap langganan dan menghantar amaran bila perlu.
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
  const stations = await getStations().catch(() => []);
  const readings = new Map<string, Promise<PrimaryReading | null>>();
  const readingFor = (lat: number, lon: number) => {
    const key = `${lat},${lon}`;
    if (!readings.has(key)) {
      readings.set(
        key,
        getAirQuality(lat, lon)
          .then((series) => {
            const reading = buildReading(series, now);
            reading.official = officialFor(
              stations,
              { lat, lon },
              localHourKey(now),
            );
            return primaryReading(reading);
          })
          .catch(() => null),
      );
    }
    return readings.get(key)!;
  };

  const summary = { checked: 0, sent: 0, removed: 0, failed: 0 };
  records: for (const record of await allRecords()) {
    summary.checked++;
    let changed = false;
    const locations = [...record.locations];
    for (const [i, location] of locations.entries()) {
      const primary = await readingFor(location.lat, location.lon);
      if (!primary) continue;
      const decision = decideAlert(
        location,
        primary,
        location.name,
        now,
        record.threshold,
        record.lang ?? "ms",
      );
      if (!decision.send) continue;
      try {
        await webpush.sendNotification(
          record.subscription,
          JSON.stringify({
            title: decision.title,
            body: decision.body,
            url: "/",
            // Tag berasingan supaya amaran satu lokasi tidak menggantikan lokasi lain.
            tag: `hezy-ipu-${location.id}`,
          }),
          { TTL: 3600, urgency: primary.ipu > 200 ? "high" : "normal" },
        );
        locations[i] = { ...location, ...decision.next };
        changed = true;
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
    if (changed) await saveRecord({ ...record, locations });
  }
  return Response.json(summary);
}
