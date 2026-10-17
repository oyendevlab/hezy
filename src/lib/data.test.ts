import { cacheLife } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APIMS_STATIONS_URL } from "./apims";
import { stationsRevalidateSeconds } from "./apims-schedule";
import {
  STATIONS_FAILURE_LIFE,
  getStations,
  getStationsResilient,
  getStationsResult,
} from "./data";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

const apims = {
  data: [
    {
      STATION_ID: "CA20B",
      STATE_NAME: "Selangor",
      STATION_LOCATION: "Shah Alam, SELANGOR",
      LATITUDE: 3.104,
      LONGITUDE: 101.556,
      API: 72,
      PARAM_SYMBOL: "**",
      RECORD_DT: "2026-10-17T20:00:00",
    },
  ],
};

const ok = () => new Response(JSON.stringify(apims), { status: 200 });

/** Selesaikan janji yang menunggu `setTimeout` cubaan semula `fetchWithRetry`. */
async function settle<T>(promise: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return promise;
}

describe("getStationsResult (v0.8.13)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(cacheLife).mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("berjaya: senarai stesen, hayat cache ikut jadual APIMS", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok());
    vi.stubGlobal("fetch", fetchMock);
    const result = await settle(getStationsResult());
    // Tanpa cache fetch Next supaya isyarat tamat masa sentiasa dihantar semasa build.
    expect(fetchMock).toHaveBeenCalledWith(
      APIMS_STATIONS_URL,
      expect.objectContaining({
        cache: "no-store",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(result.stations).toHaveLength(1);
    expect(result.stations?.[0]).toMatchObject({ id: "CA20B", ipu: 72 });
    expect(cacheLife).toHaveBeenCalledWith({
      stale: 60,
      revalidate: stationsRevalidateSeconds(result.stations!, new Date()),
      expire: 3600,
    });
  });

  it.each([
    ["rangkaian gagal", () => Promise.reject(new TypeError("fetch failed"))],
    [
      "tamat masa",
      () =>
        Promise.reject(
          new DOMException(
            "The operation was aborted due to timeout",
            "TimeoutError",
          ),
        ),
    ],
    ["503", () => Promise.resolve(new Response("", { status: 503 }))],
  ])("%s: tidak ditolak, 'tiada data' dengan hayat pendek", async (_, fail) => {
    const fetchMock = vi.fn(fail);
    vi.stubGlobal("fetch", fetchMock);
    const result = await settle(getStationsResult());
    expect(result.stations).toBeNull();
    expect("error" in result && result.error).toBeTruthy();
    // Cuba semula sekali (v0.8.10) sebelum mengalah.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(cacheLife).toHaveBeenCalledTimes(1);
    expect(cacheLife).toHaveBeenCalledWith(STATIONS_FAILURE_LIFE);
  });

  it("hayat kegagalan masih boleh diprarender dan cepat disegarkan", () => {
    const { stale, revalidate, expire } = STATIONS_FAILURE_LIFE;
    // Ambang dokumen cacheLife: stale < 30 s atau expire < 5 min = dikecualikan daripada prarender.
    expect(stale).toBeGreaterThanOrEqual(30);
    expect(expire).toBeGreaterThanOrEqual(300);
    expect(revalidate).toBeGreaterThan(0);
    expect(revalidate).toBeLessThanOrEqual(60);
    expect(expire).toBeGreaterThan(revalidate);
  });

  it("getStations melontar ralat bila APIMS gagal (untuk API dan sandaran)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 502 })),
    );
    const assertion = expect(getStations()).rejects.toThrow(
      "APIMS memulangkan status 502",
    );
    await vi.runAllTimersAsync();
    await assertion;
  });

  it("getStationsResilient guna senarai terakhir bila APIMS gagal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok()));
    const fresh = await settle(getStationsResilient());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );
    expect(await settle(getStationsResilient())).toEqual(fresh);
  });
});
