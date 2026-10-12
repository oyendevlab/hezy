import { describe, expect, it } from "vitest";
import {
  addDays,
  firstDate,
  hoursForDate,
  monthLabelWeeks,
  mergeHours,
  stationHistory,
  summarize,
  toWeeks,
  updateIndex,
  type HourlyDay,
} from "./history";

const NOW = new Date("2026-10-12T05:00:00Z");

describe("hoursForDate", () => {
  it("mengambil jam bagi tarikh yang diminta sahaja (respons 25 jam APIMS)", () => {
    const hours = hoursForDate(
      [
        { time: "2026-10-10T23:00", ipu: 80 },
        { time: "2026-10-11T00:00", ipu: 86 },
        { time: "2026-10-11T13:00", ipu: null },
        { time: "2026-10-11T23:00", ipu: 90 },
      ],
      "2026-10-11",
    );
    expect(hours).toHaveLength(24);
    expect(hours[0]).toBe(86);
    expect(hours[13]).toBeNull();
    expect(hours[23]).toBe(90);
  });
});

describe("mergeHours dan summarize", () => {
  it("tidak menimpa nilai sedia ada dengan null", () => {
    const a = [10, null, 30, ...Array(21).fill(null)];
    const b = [null, 20, 35, ...Array(21).fill(null)];
    expect(mergeHours(a, b).slice(0, 3)).toEqual([10, 20, 35]);
  });

  it("meringkaskan maks, purata dan bilangan jam", () => {
    expect(summarize([100, 150, null, 50, ...Array(20).fill(null)])).toEqual([
      150, 100, 3,
    ]);
    expect(summarize(Array(24).fill(null))).toBeNull();
  });
});

describe("updateIndex dan stationHistory", () => {
  const day: HourlyDay = {
    date: "2026-10-11",
    stations: {
      CA17W: [120, 153, ...Array(22).fill(null)],
      CA01R: Array(24).fill(null),
    },
  };

  it("menyimpan ringkasan dan membuang tarikh lama", () => {
    const index = updateIndex(
      { updatedAt: "", days: { "2025-01-01": { X: [1, 1, 1] } } },
      day,
      NOW,
    );
    expect(index.days["2026-10-11"]).toEqual({ CA17W: [153, 137, 2] });
    expect(index.days["2025-01-01"]).toBeUndefined();
    expect(firstDate(index, "CA17W")).toBe("2026-10-11");
    expect(firstDate(index, "TIADA")).toBeNull();

    const history = stationHistory(index, "CA17W", "2026-10-12", 3);
    expect(history).toEqual([
      { date: "2026-10-10", max: null, avg: null, hours: 0 },
      { date: "2026-10-11", max: 153, avg: 137, hours: 2 },
      { date: "2026-10-12", max: null, avg: null, hours: 0 },
    ]);
  });
});

describe("toWeeks", () => {
  it("menyusun hari dalam lajur Isnin–Ahad", () => {
    // 12 Okt 2026 ialah hari Isnin.
    const days = Array.from({ length: 10 }, (_, i) => ({
      date: addDays("2026-10-08", i),
      max: null,
      avg: null,
      hours: 0,
    }));
    const weeks = toWeeks(days);
    expect(weeks).toHaveLength(2);
    // Khamis 8 Okt → baris ke-4 (indeks 3) dalam minggu pertama.
    expect(weeks[0].slice(0, 3)).toEqual([null, null, null]);
    expect(weeks[0][3]?.date).toBe("2026-10-08");
    expect(weeks[1][0]?.date).toBe("2026-10-12");
    expect(weeks[1][5]?.date).toBe("2026-10-17");
    expect(weeks[1][6]).toBeNull();
  });
});

describe("monthLabelWeeks", () => {
  const range = (start: string, n: number) =>
    Array.from({ length: n }, (_, i) => ({
      date: addDays(start, i),
      max: null,
      avg: null,
      hours: 0,
    }));

  it("satu label bagi setiap bulan pada minggu hari pertama bulan", () => {
    // 84 hari berakhir 12 Okt 2026 (bermula Selasa 21 Jul).
    const labels = monthLabelWeeks(toWeeks(range("2026-07-21", 84)));
    expect(labels.filter(Boolean)).toEqual([
      "2026-08-01",
      "2026-09-01",
      "2026-10-01",
    ]);
  });

  it("melabel minggu pertama bila minggu kedua tiada label", () => {
    const labels = monthLabelWeeks(toWeeks(range("2026-09-08", 30)));
    expect(labels[0]).toBe("2026-09-08");
    expect(labels.filter(Boolean)).toEqual(["2026-09-08", "2026-10-01"]);
  });
});
