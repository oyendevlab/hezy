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

describe("buildReading — ramalan 3 hari", () => {
  it("mengira purata dan maksimum IPU unit JAS (purata 24 jam) bagi 3 hari selepas hari ini", () => {
    // 9–14 Okt; hari selepas 11 Okt mempunyai PM2.5 malar berbeza. Purata 24 jam berubah
    // perlahan, jadi IPU malar hari itu hanya dicapai pada jam terakhir (seperti IPU rasmi).
    const reading = buildReading(
      series((h) => (h < 72 ? 35 : h < 96 ? 12 : h < 120 ? 100 : 160), 6),
      NOW,
    );
    expect(reading.days).toEqual([
      { date: "2026-10-12", averageIpu: 59, maxIpu: 68 },
      { date: "2026-10-13", averageIpu: 89, maxIpu: 133 },
      { date: "2026-10-14", averageIpu: 175, maxIpu: 210 },
    ]);
  });

  it("lonjakan model sejam tidak menjadi puncak ramalan harian (v0.8.3)", () => {
    // 3 jam PM2.5 300 pada 12 Okt (IPU sejam 350); hari lain 30.
    const reading = buildReading(
      series((h) => (h >= 84 && h < 87 ? 300 : 30), 5),
      NOW,
    );
    const day = reading.days.find((d) => d.date === "2026-10-12")!;
    expect(day.maxIpu).toBeLessThan(110);
  });

  it("jam ramalan membawa jasIpu untuk ringkasan harian", () => {
    const reading = buildReading(
      series(() => 35),
      NOW,
    );
    const future = reading.today.filter((h) => h.forecast);
    expect(future.length).toBeGreaterThan(0);
    expect(future.every((h) => h.jasIpu !== undefined)).toBe(true);
    expect(
      reading.today
        .filter((h) => !h.forecast)
        .some((h) => h.jasIpu !== undefined),
    ).toBe(false);
  });

  it("melangkau hari yang datanya tidak mencukupi", () => {
    const reading = buildReading(
      series((h) => (h >= 96 ? null : 35), 5),
      NOW,
    );
    expect(reading.days.map((d) => d.date)).toEqual(["2026-10-12"]);
  });
});
