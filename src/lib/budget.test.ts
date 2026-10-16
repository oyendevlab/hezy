import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLastGoodStore, handled, withinBudget } from "./budget";

describe("withinBudget", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("memulangkan nilai yang siap dalam tempoh", async () => {
    const result = withinBudget(Promise.resolve(42), 1000);
    await expect(result).resolves.toEqual({ status: "ok", value: 42 });
  });

  it("memulangkan late bila sumber lambat, tanpa membatalkannya", async () => {
    let done = false;
    const slow = new Promise<string>((resolve) =>
      setTimeout(() => {
        done = true;
        resolve("cuaca");
      }, 5000),
    );
    const result = withinBudget(slow, 1000);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toEqual({ status: "late" });
    await vi.advanceTimersByTimeAsync(4000);
    expect(done).toBe(true);
    await expect(slow).resolves.toBe("cuaca");
  });

  it("memulangkan error tanpa melontar", async () => {
    const error = new Error("Open-Meteo 503");
    const result = withinBudget(Promise.reject(error), 1000);
    await expect(result).resolves.toEqual({ status: "error", error });
  });

  it("had sifar atau negatif bermakna tiada penantian", async () => {
    const result = withinBudget(new Promise(() => undefined), -5);
    await vi.advanceTimersByTimeAsync(0);
    await expect(result).resolves.toEqual({ status: "late" });
  });
});

describe("handled", () => {
  it("memulangkan promise yang sama dan penolakan masih boleh ditangkap", async () => {
    const error = new Error("gagal");
    const promise = handled(Promise.reject(error));
    await expect(promise).rejects.toBe(error);
  });
});

describe("createLastGoodStore", () => {
  it("mengingati nilai terakhir dan mengabaikan nilai terlalu lama", () => {
    const store = createLastGoodStore<string>(10, 1000);
    store.remember("3.1,101.7", "siri", 0);
    expect(store.recall("3.1,101.7", 500)).toBe("siri");
    expect(store.recall("3.1,101.7", 1500)).toBeUndefined();
    expect(store.recall("lain", 0)).toBeUndefined();
  });

  it("membuang entri paling lama bila penuh", () => {
    const store = createLastGoodStore<number>(2, 10_000);
    store.remember("a", 1, 0);
    store.remember("b", 2, 0);
    store.remember("a", 3, 1); // a kini terbaharu
    store.remember("c", 4, 2);
    expect(store.recall("b", 3)).toBeUndefined();
    expect(store.recall("a", 3)).toBe(3);
    expect(store.recall("c", 3)).toBe(4);
  });
});
