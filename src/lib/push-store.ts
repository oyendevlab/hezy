import { BlobPreconditionFailedError, get, list, put } from "@vercel/blob";
import { normalizeRecord, type PushRecord } from "./push-record";

export type { PushRecord };

/**
 * Semua langganan dalam satu fail (v0.8.14). Sebelum ini satu fail setiap peranti, jadi setiap
 * semakan amaran membaca 58 fail (kuota Hobby "Simple Requests" Blob 75% pada 18 Okt 2026).
 * Tulisan guna ETag (`ifMatch`) supaya langganan baharu tidak hilang bila semakan menulis serentak.
 */
export const INDEX_PATH = "push-index/subscriptions.json";
/** Status larian semakan terakhir (untuk pemantauan). */
export const STATUS_PATH = "push-index/status.json";
/** Fail lama satu-per-peranti (`push/<sha256>.json`), dipindah sekali ke indeks. */
export const LEGACY_PREFIX = "push/";
const MAX_ATTEMPTS = 5;

type IndexFile = { version: 1; records: PushRecord[] };

const json = (data: unknown) => JSON.stringify(data);

/**
 * ETag kuat untuk `ifMatch`. Respons dimampatkan (indeks ~48 KB) memulangkan ETag lemah
 * `W/"…"` dengan cincangan yang sama, dan `ifMatch` dengan ETag lemah sentiasa gagal (production
 * 18 Okt 2026: "Precondition failed: ETag mismatch").
 */
export const strongEtag = (etag: string) => etag.replace(/^W\//, "");

async function readBlobJson(
  path: string,
): Promise<{ value: unknown; etag: string } | null> {
  const result = await get(path, {
    access: "private",
    useCache: false,
    // Tanpa mampatan supaya ETag yang dipulangkan ialah ETag kuat.
    headers: { "Accept-Encoding": "identity" },
  });
  if (!result || result.statusCode !== 200) return null;
  return {
    value: await new Response(result.stream).json(),
    etag: strongEtag(result.blob.etag),
  };
}

function parseIndex(saved: { value: unknown; etag: string }) {
  const file = saved.value as Partial<IndexFile> | null;
  if (!file || !Array.isArray(file.records))
    throw new Error("Indeks langganan rosak.");
  return { records: file.records.map(normalizeRecord), etag: saved.etag };
}

/**
 * Pindah fail lama ke indeks (sekali). Indeks dicipta tanpa tulis ganti. Fail lama dikekalkan
 * sebagai sandaran (tiada kod lain membacanya) dan boleh dipadam selepas indeks disahkan.
 */
async function migrateLegacy(): Promise<{
  records: PushRecord[];
  etag: string;
}> {
  const records: PushRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: LEGACY_PREFIX, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const saved = await readBlobJson(blob.pathname);
      if (saved) records.push(normalizeRecord(saved.value as PushRecord));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const written = await put(INDEX_PATH, json({ version: 1, records }), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: "application/json",
  });
  return { records, etag: written.etag };
}

async function readIndex(): Promise<{ records: PushRecord[]; etag: string }> {
  const saved = await readBlobJson(INDEX_PATH);
  if (saved) return parseIndex(saved);
  try {
    return await migrateLegacy();
  } catch (error) {
    // Instans lain mungkin mencipta indeks serentak: baca semula.
    const retry = await readBlobJson(INDEX_PATH);
    if (!retry) throw error;
    return parseIndex(retry);
  }
}

/**
 * Baca-ubah-tulis indeks. `mutate` memulangkan senarai baharu, atau null jika tiada perubahan.
 * Bila indeks berubah antara baca dan tulis (ETag tidak sepadan), diulang dengan data terkini.
 */
export async function updateRecords(
  mutate: (records: PushRecord[]) => PushRecord[] | null,
): Promise<PushRecord[]> {
  for (let attempt = 1; ; attempt++) {
    const { records, etag } = await readIndex();
    const next = mutate(records);
    if (next === null) return records;
    try {
      await put(INDEX_PATH, json({ version: 1, records: next }), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        ifMatch: etag,
        contentType: "application/json",
      });
      return next;
    } catch (error) {
      if (
        !(error instanceof BlobPreconditionFailedError) ||
        attempt >= MAX_ATTEMPTS
      )
        throw error;
      // Penulis lain baru menulis: beri masa sebelum membaca semula.
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
    }
  }
}

/** Semua rekod langganan (satu bacaan). */
export async function allRecords(): Promise<PushRecord[]> {
  return (await readIndex()).records;
}

export async function readRecord(endpoint: string): Promise<PushRecord | null> {
  return (
    (await allRecords()).find((r) => r.subscription.endpoint === endpoint) ??
    null
  );
}

/** Simpan (ganti atau tambah) rekod bagi endpoint ini. */
export async function saveRecord(record: PushRecord) {
  const endpoint = record.subscription.endpoint;
  await updateRecords((records) => [
    ...records.filter((r) => r.subscription.endpoint !== endpoint),
    record,
  ]);
}

export async function deleteRecord(endpoint: string) {
  await updateRecords((records) => {
    const next = records.filter((r) => r.subscription.endpoint !== endpoint);
    return next.length === records.length ? null : next;
  });
}

/** Status larian semakan amaran terakhir (v0.8.14). */
export type CheckStatus = {
  /** Masa larian terakhir (ISO), termasuk larian yang dilangkau. */
  checkedAt: string;
  /** Masa larian terakhir yang memproses semua langganan (ISO). */
  processedAt: string | null;
  /** Jam dan bacaan APIMS terkini yang sudah diproses, cth. "2026-10-18T21:00|2026-10-18T21:00". */
  version: string | null;
  checked: number;
  sent: number;
  failed: number;
};

export async function readCheckStatus(): Promise<CheckStatus | null> {
  const saved = await readBlobJson(STATUS_PATH);
  return (saved?.value as CheckStatus | undefined) ?? null;
}

export async function writeCheckStatus(status: CheckStatus) {
  await put(STATUS_PATH, json(status), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
