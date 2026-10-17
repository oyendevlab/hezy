import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithRetry } from "./http";

const ok = () => new Response("{}", { status: 200 });

describe("fetchWithRetry", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("tidak mencuba semula bila berjaya atau ralat klien (4xx)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchWithRetry("https://x.test", { timeoutMs: 1000 }, 0);
    expect(res.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mencuba semula sekali selepas 502 atau 429", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 502 }))
      .mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchWithRetry("https://x.test", { timeoutMs: 1000 }, 0);
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("mencuba semula selepas ralat rangkaian atau tamat masa", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("timeout", "TimeoutError"))
      .mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchWithRetry("https://x.test", { timeoutMs: 1000 }, 0);
    expect(res.status).toBe(200);
  });

  it("ralat cubaan kedua dilontar kepada pemanggil", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      fetchWithRetry("https://x.test", { timeoutMs: 1000 }, 0),
    ).rejects.toThrow("fetch failed");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
