import { getStationsResilient } from "@/lib/data";
import { loadReading } from "@/lib/load-reading";
import {
  applySent,
  checkVersion,
  planNotifications,
  reapplySent,
  type PlannedUpdate,
} from "@/lib/push-plan";
import {
  allRecords,
  readCheckStatus,
  updateRecords,
  writeCheckStatus,
  type PushRecord,
} from "@/lib/push-store";
import { isPushServiceEndpoint } from "@/lib/push-validate";
import { localHourKey, type Reading } from "@/lib/reading";
import { isCronAuthorized } from "@/lib/request-guard";
import { WebPushError, webpush } from "@/lib/web-push";

/**
 * GET /api/push/check — Vercel Cron setiap 15 minit (v0.8.14; Authorization: Bearer CRON_SECRET).
 * Bagi setiap langganan: amaran ambang (ditangguh semasa waktu senyap), ringkasan pagi
 * dan amaran ramalan esok mengikut pilihan pengguna.
 *
 * Larian dilangkau bila jam dan bacaan APIMS terkini sudah diproses tanpa kegagalan (semua logik
 * amaran berasaskan jam); `?force=1` memaksa pemprosesan.
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
  if (!isCronAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Tidak dibenarkan." }, { status: 401 });
  }

  const now = new Date();
  const force = new URL(request.url).searchParams.get("force") === "1";
  const stations = await getStationsResilient().catch(() => null);
  const version = checkVersion(localHourKey(now), stations);
  const previous = await readCheckStatus().catch(() => null);
  if (!force && previous?.version === version) {
    await writeCheckStatus({ ...previous, checkedAt: now.toISOString() });
    return Response.json({ skipped: true, version });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "https://hezy.my",
    publicKey,
    privateKey,
  );
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
  const removed = new Set<string>();
  const sent = new Map<
    string,
    { processed: PushRecord; updates: PlannedUpdate[] }
  >();
  records: for (const original of await allRecords()) {
    summary.checked++;
    const endpoint = original.subscription.endpoint;
    // Rekod sebelum v0.8.1 mungkin ada endpoint sebarangan: jangan hantar, buang terus.
    if (!isPushServiceEndpoint(endpoint)) {
      removed.add(endpoint);
      continue;
    }
    let record = original;
    const updates: PlannedUpdate[] = [];
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
        updates.push(note.update);
        summary.sent++;
      } catch (error) {
        if (
          error instanceof WebPushError &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          // Langganan sudah tamat atau dibatalkan di peranti.
          removed.add(endpoint);
          continue records;
        }
        console.error("[api/push/check]", error);
        summary.failed++;
      }
    }
    if (updates.length) sent.set(endpoint, { processed: original, updates });
  }

  // Satu tulisan indeks, digabung dengan data terkini (langganan baharu semasa larian kekal).
  if (removed.size || sent.size) {
    await updateRecords((latest) =>
      latest
        .filter((r) => !removed.has(r.subscription.endpoint))
        .map((r) => {
          const change = sent.get(r.subscription.endpoint);
          return change
            ? reapplySent(r, change.processed, change.updates, now)
            : r;
        }),
    );
  }
  summary.removed = removed.size;
  await writeCheckStatus({
    checkedAt: now.toISOString(),
    processedAt: now.toISOString(),
    // Larian dengan kegagalan diulang pada larian seterusnya.
    version: summary.failed === 0 ? version : (previous?.version ?? null),
    checked: summary.checked,
    sent: summary.sent,
    failed: summary.failed,
  });
  return Response.json({ ...summary, version });
}
