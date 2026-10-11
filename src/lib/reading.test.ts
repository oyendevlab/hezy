import { describe, expect, it } from "vitest";
import { buildReading, localHourKey } from "./reading";

/** Siri 3 hari (2 hari lepas + hari ini) bermula 9 Okt 00:00 waktu Malaysia. */
function series(pm25: (h: number) => number | null, days = 4) {
  const times: string[] = [];
  const values: (number | null)[] = [];
  for (let h = 0; h < days * 24; h++) {
    const day = 9 + Math.floor(h / 24);
    times.push(
      `2026-10-${String(day).padStart(2, "0")}T${String(h % 24).padStart(2, "0")}:00`,
    );
    values.push(pm25(h));
  }
  return { times, pm25: values };
}

// 11 Okt 2026, 10:30 waktu Malaysia (UTC+8).
const NOW = new Date("2026-10-11T02:30:00Z");

describe("localHourKey", () => {
  it("menukar masa kepada jam tempatan Malaysia", () => {
    expect(localHourKey(NOW)).toBe("2026-10-11T10:00");
  });
});

describe("buildReading", () => {
  it("mengira IPU semasa daripada purata PM2.5 24 jam", () => {
    const reading = buildReading(
      series(() => 35),
      NOW,
    );
    expect(reading.current).toMatchObject({
      time: "2026-10-11T10:00",
      ipu: 69,
      category: "sederhana",
      label: "Sederhana",
      emergency: false,
    });
    expect(reading.change3h).toBe(0);
    expect(reading.stale).toBe(false);
    expect(reading.estimate).toBe(true);
  });

  it("memulangkan 24 jam hari ini dengan jam selepas sekarang sebagai ramalan", () => {
    const { today } = buildReading(
      series(() => 35),
      NOW,
    );
    expect(today).toHaveLength(24);
    expect(today[10]).toMatchObject({
      time: "2026-10-11T10:00",
      forecast: false,
    });
    expect(today[11].forecast).toBe(true);
  });

  it("mencari masa terbaik untuk keluar selepas jam sekarang", () => {
    // PM2.5 rendah pada jam 21–23 hari ini sahaja.
    const reading = buildReading(
      series((h) => (h >= 69 && h <= 71 ? 0 : 60)),
      NOW,
    );
    expect(reading.bestWindow?.start).toBe("2026-10-11T21:00");
  });

  it("menanda bacaan lapuk bila data terkini lebih 3 jam lalu", () => {
    const reading = buildReading(
      series((h) => (h > 54 ? null : 35)),
      NOW,
    );
    expect(reading.current?.time).toBe("2026-10-11T06:00");
    expect(reading.stale).toBe(true);
  });

  it("tiada bacaan semasa jika data tidak mencukupi", () => {
    const reading = buildReading(
      series(() => null),
      NOW,
    );
    expect(reading.current).toBeNull();
    expect(reading.stale).toBe(true);
  });
});

describe("buildReading — IPU sejam", () => {
  it("mengira IPU sejam daripada PM2.5 jam itu sahaja", () => {
    const reading = buildReading(
      series((h) => (h === 58 ? 100 : 35)),
      NOW,
    );
    expect(reading.today[10]).toMatchObject({ hourlyIpu: 133 });
    expect(reading.today[9]).toMatchObject({ hourlyIpu: 69 });
  });

  it("mencari masa terbaik hingga esok bila hari hampir tamat", () => {
    // 22:30 waktu Malaysia; PM2.5 rendah pada jam 03–05 esok.
    const lateNight = new Date("2026-10-11T14:30:00Z");
    const reading = buildReading(
      series((h) => (h >= 75 && h <= 77 ? 0 : 60)),
      lateNight,
    );
    expect(reading.bestWindow).toMatchObject({
      start: "2026-10-12T03:00",
      end: "2026-10-12T05:00",
      averageIpu: 0,
    });
  });
});
