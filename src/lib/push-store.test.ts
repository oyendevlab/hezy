import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PushRecord } from "./push-record";

// Stor Blob palsu dalam memori dengan ETag, `ifMatch` dan `allowOverwrite` seperti @vercel/blob.
const store = vi.hoisted(() => ({
  files: new Map<string, { body: string; etag: string }>(),
  counter: 0,
  gets: 0,
  /** Dipanggil sekali sebelum `put` seterusnya (untuk mensimulasikan tulisan serentak). */
  beforePut: null as null | (() => void),
}));

vi.mock("@vercel/blob", () => {
  class BlobPreconditionFailedError extends Error {}
  const nextEtag = () => `"e${++store.counter}"`;
  return {
    BlobPreconditionFailedError,
    get: vi.fn(async (path: string) => {
      store.gets++;
      const file = store.files.get(path);
      if (!file) return null;
      return {
        statusCode: 200,
        stream: new Response(file.body).body,
        blob: { etag: file.etag },
      };
    }),
    put: vi.fn(
      async (
        path: string,
        body: string,
        opts: { allowOverwrite?: boolean; ifMatch?: string },
      ) => {
        const hook = store.beforePut;
        store.beforePut = null;
        hook?.();
        const existing = store.files.get(path);
        if (existing && !opts.allowOverwrite)
          throw new Error("This blob already exists");
        if (opts.ifMatch && existing?.etag !== opts.ifMatch)
          throw new BlobPreconditionFailedError();
        const etag = nextEtag();
        store.files.set(path, { body, etag });
        return { etag, pathname: path };
      },
    ),
    list: vi.fn(async ({ prefix }: { prefix: string }) => ({
      blobs: [...store.files.keys()]
        .filter((p) => p.startsWith(prefix))
        .map((pathname) => ({ pathname, url: `https://blob/${pathname}` })),
      hasMore: false,
    })),
    del: vi.fn(async (urls: string[]) => {
      for (const url of urls)
        store.files.delete(url.replace("https://blob/", ""));
    }),
  };
});

const {
  INDEX_PATH,
  allRecords,
  deleteRecord,
  readRecord,
  saveRecord,
  updateRecords,
} = await import("./push-store");

const record = (endpoint: string): PushRecord => ({
  subscription: {
    endpoint: `https://fcm.googleapis.com/fcm/send/${endpoint}`,
    keys: { p256dh: "k", auth: "a" },
  },
  threshold: 100,
  locations: [
    { id: "semasa", name: "Putrajaya", lat: 2.93, lon: 101.69 },
  ] as PushRecord["locations"],
  createdAt: "2026-10-18T00:00:00.000Z",
});
const setFile = (path: string, data: unknown) =>
  store.files.set(path, { body: JSON.stringify(data), etag: `"x${path}"` });

beforeEach(() => {
  store.files.clear();
  store.gets = 0;
  store.beforePut = null;
});

describe("push-store (indeks satu fail, v0.8.14)", () => {
  it("memindah fail lama ke indeks sekali; fail lama kekal sebagai sandaran", async () => {
    setFile("push/aaa.json", record("a"));
    setFile("push/bbb.json", record("b"));
    const records = await allRecords();
    expect(records.map((r) => r.subscription.endpoint).sort()).toEqual([
      "https://fcm.googleapis.com/fcm/send/a",
      "https://fcm.googleapis.com/fcm/send/b",
    ]);
    expect([...store.files.keys()].sort()).toEqual([
      "push-index/subscriptions.json",
      "push/aaa.json",
      "push/bbb.json",
    ]);
    // Bacaan seterusnya guna indeks sahaja (tiada migrasi semula).
    store.gets = 0;
    await allRecords();
    expect(store.gets).toBe(1);
  });

  it("semakan membaca satu fail sahaja", async () => {
    await saveRecord(record("a"));
    await saveRecord(record("b"));
    store.gets = 0;
    expect(await allRecords()).toHaveLength(2);
    expect(store.gets).toBe(1);
  });

  it("simpan menggantikan endpoint sama; padam membuang", async () => {
    await saveRecord(record("a"));
    await saveRecord({ ...record("a"), threshold: 200 });
    expect(await allRecords()).toHaveLength(1);
    expect(
      (await readRecord(record("a").subscription.endpoint))?.threshold,
    ).toBe(200);
    await deleteRecord(record("a").subscription.endpoint);
    expect(await allRecords()).toEqual([]);
  });

  it("tulisan serentak tidak menghilangkan langganan (ETag, cuba semula)", async () => {
    await saveRecord(record("a"));
    // Langganan baharu ditulis sejurus sebelum tulisan semakan.
    store.beforePut = () => {
      const file = store.files.get(INDEX_PATH)!;
      const index = JSON.parse(file.body);
      index.records.push(record("baru"));
      store.files.set(INDEX_PATH, {
        body: JSON.stringify(index),
        etag: '"lain"',
      });
    };
    await updateRecords((latest) =>
      latest.map((r) => ({ ...r, lastMorning: "2026-10-18" })),
    );
    const records = await allRecords();
    expect(records.map((r) => r.subscription.endpoint)).toContain(
      "https://fcm.googleapis.com/fcm/send/baru",
    );
    expect(records.every((r) => r.lastMorning === "2026-10-18")).toBe(true);
  });

  it("tiada perubahan: tiada tulisan", async () => {
    await saveRecord(record("a"));
    const etag = store.files.get(INDEX_PATH)!.etag;
    await deleteRecord("https://fcm.googleapis.com/fcm/send/tiada");
    expect(store.files.get(INDEX_PATH)!.etag).toBe(etag);
  });
});
