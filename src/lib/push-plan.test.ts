import { describe, expect, it } from "vitest";
import { ipuCategory } from "./ipu";
import { applySent, inQuietHours, planNotifications } from "./push-plan";
import type { PushRecord } from "./push-record";
import type { Reading } from "./reading";

/** Waktu Malaysia (UTC+8) → Date. */
const at = (myt: string) => new Date(`${myt}:00+08:00`);

const reading = (ipu: number, tomorrowAvg = 60): Reading =>
  ({
    source: "open-meteo",
    estimate: true,
    generatedAt: "",
    current: {
      time: "2026-10-12T07:00",
      ipu,
      category: ipuCategory(ipu).key,
      label: ipuCategory(ipu).label,
      emergency: false,
      pm25Average: 0,
    },
    change3h: null,
    today: [],
    bestWindow: {
      start: "2026-10-12T08:00",
      end: "2026-10-12T10:00",
      averageIpu: 70,
    },
    days: [
      { date: "2026-10-13", averageIpu: tomorrowAvg, maxIpu: tomorrowAvg + 30 },
    ],
    stale: false,
    official: null,
  }) as Reading;

const record = (over: Partial<PushRecord> = {}): PushRecord => ({
  subscription: { endpoint: "https://x", keys: { p256dh: "a", auth: "b" } },
  threshold: 100,
  lang: "ms",
  createdAt: "",
  locations: [
    {
      id: "semasa",
      name: "Shah Alam",
      lat: 3.07,
      lon: 101.52,
      lastAlertKey: null,
      lastAlertAt: null,
    },
  ],
  options: {
    morning: true,
    forecast: true,
    quiet: { start: 23, end: 6 },
  },
  ...over,
});

describe("inQuietHours", () => {
  it("julat merentasi tengah malam dan julat biasa", () => {
    const q = { start: 23, end: 6 };
    expect([22, 23, 0, 5, 6].map((h) => inQuietHours(h, q))).toEqual([
      false,
      true,
      true,
      true,
      false,
    ]);
    expect(inQuietHours(14, { start: 13, end: 15 })).toBe(true);
    expect(inQuietHours(2, null)).toBe(false);
  });
});

describe("planNotifications", () => {
  it("amaran ambang ditangguh semasa waktu senyap, dihantar selepasnya", () => {
    const r = record({
      options: {
        morning: false,
        forecast: false,
        quiet: { start: 23, end: 6 },
      },
    });
    expect(
      planNotifications(r, [reading(150)], at("2026-10-12T02:12")),
    ).toEqual([]);
    const later = planNotifications(r, [reading(150)], at("2026-10-12T06:12"));
    expect(later).toHaveLength(1);
    expect(later[0].title).toBe("Jerebu di Shah Alam: IPU 150 (Tidak Sihat)");
  });

  it("lencana ikon: IPU semasa amaran, padam bila udara pulih", () => {
    const r = record({ options: undefined });
    const [alert] = planNotifications(
      r,
      [reading(150)],
      at("2026-10-12T09:12"),
    );
    expect(alert.badge).toBe(150);
    const after = applySent(r, alert.update, at("2026-10-12T09:12"));
    const [recovered] = planNotifications(
      after,
      [reading(60)],
      at("2026-10-12T10:12"),
    );
    expect(recovered.title).toBe("Udara pulih di Shah Alam: IPU 60");
    expect(recovered.badge).toBeNull();
  });

  it("IPU > 300 dihantar walaupun dalam waktu senyap", () => {
    const notes = planNotifications(
      record(),
      [reading(320)],
      at("2026-10-12T02:12"),
    );
    expect(notes.map((n) => n.update.kind)).toEqual(["alert"]);
    expect(notes[0].urgency).toBe("high");
  });

  it("ringkasan pagi sekali sehari antara 7 dan 11 pagi", () => {
    const notes = planNotifications(
      record(),
      [reading(80)],
      at("2026-10-12T07:12"),
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      title: "Pagi ini di Shah Alam: IPU 80 (Sederhana)",
      tag: "hezy-pagi",
    });
    expect(notes[0].body).toContain("Masa terbaik keluar: 8 – 10 pagi (~70).");
    const sent = applySent(record(), notes[0].update, at("2026-10-12T07:12"));
    expect(sent.lastMorning).toBe("2026-10-12");
    expect(
      planNotifications(sent, [reading(80)], at("2026-10-12T08:12")),
    ).toEqual([]);
    expect(
      planNotifications(record(), [reading(80)], at("2026-10-12T11:12")),
    ).toEqual([]);
  });

  it("amaran ramalan esok jam 8 malam bila purata melebihi ambang", () => {
    const notes = planNotifications(
      record(),
      [reading(80, 140)],
      at("2026-10-12T20:12"),
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      title: "Esok di Shah Alam: ramalan IPU 140 (Tidak Sihat)",
      tag: "hezy-esok-semasa",
    });
    expect(notes[0].body.startsWith("Puncak ~170.")).toBe(true);
    const sent = applySent(record(), notes[0].update, at("2026-10-12T20:12"));
    expect(sent.locations[0].lastForecast).toBe("2026-10-12");
    expect(
      planNotifications(sent, [reading(80, 140)], at("2026-10-12T21:12")),
    ).toEqual([]);
    // Di bawah ambang: tiada amaran.
    expect(
      planNotifications(record(), [reading(80, 90)], at("2026-10-12T20:12")),
    ).toEqual([]);
  });

  it("rekod lama tanpa pilihan: hanya amaran ambang, tanpa waktu senyap", () => {
    const legacy = record({ options: undefined });
    const notes = planNotifications(
      legacy,
      [reading(150, 160)],
      at("2026-10-12T02:12"),
    );
    expect(notes.map((n) => n.update.kind)).toEqual(["alert"]);
  });

  it("notifikasi dalam bahasa Inggeris", () => {
    const notes = planNotifications(
      record({ lang: "en" }),
      [reading(80)],
      at("2026-10-12T07:12"),
    );
    expect(notes[0].title).toBe("This morning in Shah Alam: API 80 (Moderate)");
    expect(notes[0].body).toContain("Best time to go out: 8 – 10 am (~70).");
  });
});
