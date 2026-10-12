import { createHash } from "node:crypto";
import { del, get, list, put } from "@vercel/blob";
import type { AlertState } from "./alert";
import type { SubscribeInput } from "./push-validate";

/** Rekod langganan dalam Vercel Blob (private): satu fail JSON bagi setiap peranti. */
/** `threshold` mungkin tiada pada rekod sebelum v0.3.0. */
export type PushRecord = Omit<SubscribeInput, "threshold"> &
  Partial<Pick<SubscribeInput, "threshold">> &
  AlertState & {
    createdAt: string;
  };

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
  return (await new Response(result.stream).json()) as PushRecord;
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
        records.push((await new Response(result.stream).json()) as PushRecord);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return records;
}
