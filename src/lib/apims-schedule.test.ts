import { describe, expect, it } from "vitest";
import {
  DUE_REVALIDATE_SECONDS,
  stationsDue,
  stationsRevalidateSeconds,
} from "./apims-schedule";

// 22:42 waktu Malaysia, 16 Okt 2026.
const NOW = new Date("2026-10-16T14:42:00Z");

describe("stationsRevalidateSeconds", () => {
  it("bacaan jam semasa belum terbit: semak setiap 2 minit", () => {
    const stations = [{ time: "2026-10-16T21:00" }, { time: null }];
    expect(stationsRevalidateSeconds(stations, NOW)).toBe(
      DUE_REVALIDATE_SECONDS,
    );
    expect(stationsDue(stations, NOW)).toBe(true);
    expect(stationsRevalidateSeconds([], NOW)).toBe(DUE_REVALIDATE_SECONDS);
  });

  it("sudah terbit: tunggu hingga 8 minit selepas jam berikutnya", () => {
    const stations = [
      { time: "2026-10-16T21:00" },
      { time: "2026-10-16T22:00" },
    ];
    // 22:42 → 23:08 = 26 minit.
    expect(stationsRevalidateSeconds(stations, NOW)).toBe(26 * 60);
    expect(stationsDue(stations, NOW)).toBe(false);
  });

  it("dihadkan antara 5 minit dan 1 jam", () => {
    const stations = [{ time: "2026-10-16T22:00" }];
    expect(
      stationsRevalidateSeconds(stations, new Date("2026-10-16T14:00:30Z")),
    ).toBe(3600);
    expect(
      stationsRevalidateSeconds(stations, new Date("2026-10-16T14:59:59Z")),
    ).toBe(481);
  });
});
