import { createHash } from "node:crypto";
import { del, get, list, put } from "@vercel/blob";
import { normalizeRecord, type PushRecord } from "./push-record";

export type { PushRecord };

const PREFIX = "push/";

const pathFor = (endpoint: string) =>
  `${PREFIX}${createHash("sha256").update(endpoint).digest("hex").slice(0, 40)}.json`;

export async function saveRecord(record: PushRecord) {
  await put(pathFor(record.subscription.endpoint), JSON.stringify(record), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function readRecord(endpoint: string): Promise<PushRecord | null> {
  const result = await get(pathFor(endpoint), {
    access: "private",
    useCache: false,
  });
  if (!result || result.statusCode !== 200) return null;
  return normalizeRecord(await new Response(result.stream).json());
}

export async function deleteRecord(endpoint: string) {
  await del(pathFor(endpoint));
}

/** Semua rekod langganan (dengan penomboran halaman). */
export async function allRecords(): Promise<PushRecord[]> {
  const records: PushRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const result = await get(blob.pathname, {
        access: "private",
        useCache: false,
      });
      if (result?.statusCode === 200)
        records.push(normalizeRecord(await new Response(result.stream).json()));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return records;
}
