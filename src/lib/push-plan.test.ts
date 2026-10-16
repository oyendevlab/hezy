import { describe, expect, it } from "vitest";
import { ipuCategory } from "./ipu";
import {
  applySent,
  detectExpected,
  detectSpike,
  inQuietHours,
  planNotifications,
} from "./push-plan";
import type { PushRecord } from "./push-record";
import { LEGACY_OPTIONS } from "./push-validate";
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
    spike: false,
    expected: false,
    school: false,
    quiet: { start: 23, end: 6 },
    badge: false,
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
        spike: false,
        expected: false,
        school: false,
        quiet: { start: 23, end: 6 },
        badge: false,
      },
    });
    expect(
      planNotifications(r, [reading(150)], at("2026-10-12T02:12")),
    ).toEqual([]);
    const later = planNotifications(r, [reading(150)], at("2026-10-12T06:12"));
    expect(later).toHaveLength(1);
    expect(later[0].title).toBe("Jerebu di Shah Alam: IPU 150 (Tidak Sihat)");
  });

  it("lencana ikon: IPU semasa bersama setiap notifikasi (rekod lama = hidup)", () => {
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
    expect(recovered.badge).toBe(60);
  });

  it("lencana ikon dimatikan: notifikasi tanpa nombor", () => {
    const r = record({ options: { ...LEGACY_OPTIONS, badge: false } });
    const [alert] = planNotifications(
      r,
      [reading(150)],
      at("2026-10-12T09:12"),
    );
    expect(alert.badge).toBeUndefined();
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
    expect(notes[0].body).toContain("Masa terbaik keluar: 8 – 10 AM (~70).");
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
    expect(notes[0].body).toContain("Best time to go out: 8 – 10 AM (~70).");
  });
});

/** Jam hari ini: `[jam, IPU, ramalan?]` pada 2026-10-12. */
const hours = (list: [number, number, boolean?][]) =>
  list.map(([h, v, forecast = false]) => ({
    time: `2026-10-12T${String(h).padStart(2, "0")}:00`,
    ipu: v,
    hourlyIpu: v,
    forecast,
  }));

const withToday = (ipu: number, today: ReturnType<typeof hours>): Reading =>
  ({ ...reading(ipu), today }) as Reading;

const on = (spike: boolean, expected: boolean, school = false) =>
  record({
    options: {
      morning: false,
      forecast: false,
      spike,
      expected,
      school,
      quiet: { start: 23, end: 6 },
      badge: false,
    },
  });

describe("detectSpike", () => {
  it("kenaikan ≥ 30 dalam 3 jam dan IPU > 50", () => {
    expect(
      detectSpike(
        hours([
          [9, 40],
          [10, 45],
          [11, 60],
          [12, 75],
        ]),
      ),
    ).toEqual({ from: 40, to: 75 });
    // Naik 25 sahaja.
    expect(
      detectSpike(
        hours([
          [9, 50],
          [12, 75],
        ]),
      ),
    ).toBeNull();
    // Naik 30 tetapi masih Baik (≤ 50).
    expect(
      detectSpike(
        hours([
          [9, 15],
          [12, 48],
        ]),
      ),
    ).toBeNull();
    // Tiada bacaan 3 jam sebelumnya.
    expect(
      detectSpike(
        hours([
          [11, 20],
          [12, 90],
        ]),
      ),
    ).toBeNull();
    // Jam ramalan diabaikan.
    expect(
      detectSpike(
        hours([
          [9, 40],
          [12, 50],
          [13, 99, true],
        ]),
      ),
    ).toBeNull();
  });
});

describe("detectExpected", () => {
  it("jam ramalan pertama melepasi ambang dalam 6 jam", () => {
    const today = hours([
      [12, 80],
      [13, 90, true],
      [15, 120, true],
      [17, 140, true],
      [19, 160, true],
    ]);
    expect(detectExpected(today, 100, "2026-10-12T12:00")).toEqual({
      ipu: 120,
      time: "2026-10-12T15:00",
    });
    // 19:00 di luar 6 jam dari 12:00 bila hanya itu yang tinggi.
    expect(
      detectExpected(
        hours([
          [13, 90, true],
          [19, 160, true],
        ]),
        100,
        "2026-10-12T12:00",
      ),
    ).toBeNull();
  });
});

describe("amaran lonjakan dan jerebu dijangka", () => {
  const spiking = hours([
    [9, 40],
    [10, 50],
    [11, 60],
    [12, 75],
  ]);

  it("lonjakan dihantar sekali, kemudian bertenang 6 jam", () => {
    const now = at("2026-10-12T12:12");
    const notes = planNotifications(
      on(true, false),
      [withToday(75, spiking)],
      now,
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      title: "IPU Shah Alam naik mendadak: 40 → 75",
      tag: "hezy-lonjakan-semasa",
      update: { kind: "spike", index: 0 },
    });
    expect(notes[0].body.startsWith("Naik 35 dalam 3 jam.")).toBe(true);
    const sent = applySent(on(true, false), notes[0].update, now);
    expect(sent.locations[0].lastSpike).toBe("2026-10-12T12:00");
    expect(
      planNotifications(sent, [withToday(75, spiking)], at("2026-10-12T15:12")),
    ).toEqual([]);
    expect(
      planNotifications(sent, [withToday(75, spiking)], at("2026-10-12T18:12")),
    ).toHaveLength(1);
  });

  it("lonjakan tidak dihantar bila dimatikan, waktu senyap atau melepasi ambang", () => {
    const now = at("2026-10-12T12:12");
    expect(
      planNotifications(on(false, false), [withToday(75, spiking)], now),
    ).toEqual([]);
    expect(
      planNotifications(
        on(true, false),
        [withToday(75, spiking)],
        at("2026-10-12T23:12"),
      ),
    ).toEqual([]);
    // Melepasi ambang 100: hanya amaran ambang biasa.
    const over = hours([
      [9, 80],
      [12, 130],
    ]);
    const notes = planNotifications(
      on(true, false),
      [withToday(130, over)],
      now,
    );
    expect(notes.map((n) => n.update.kind)).toEqual(["alert"]);
  });

  it("jerebu dijangka sekali sehari dengan masa ramalan", () => {
    const today = hours([
      [12, 80],
      [14, 95, true],
      [16, 130, true],
    ]);
    const now = at("2026-10-12T12:12");
    const notes = planNotifications(
      on(false, true),
      [withToday(80, today)],
      now,
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      title: "Jerebu dijangka di Shah Alam sekitar 4 PM",
      tag: "hezy-dijangka-semasa",
    });
    expect(
      notes[0].body.startsWith(
        "Ramalan IPU ~130 (Tidak Sihat) dalam 6 jam akan datang.",
      ),
    ).toBe(true);
    const sent = applySent(on(false, true), notes[0].update, now);
    expect(sent.locations[0].lastExpected).toBe("2026-10-12");
    expect(
      planNotifications(sent, [withToday(80, today)], at("2026-10-12T13:12")),
    ).toEqual([]);
  });

  it("jerebu dijangka dalam bahasa Inggeris", () => {
    const today = hours([
      [12, 80],
      [16, 130, true],
    ]);
    const notes = planNotifications(
      { ...on(false, true), lang: "en" },
      [withToday(80, today)],
      at("2026-10-12T12:12"),
    );
    expect(notes[0].title).toBe("Haze expected in Shah Alam around 4 PM");
  });
});

describe("notifikasi bacaan tinggi berterusan (sekolah)", () => {
  const withSchool = (twoPm: (number | null)[]) =>
    ({ ...reading(90), schoolTwoPm: twoPm }) as Reading;

  it("sekali sehari dari 3 petang bila jam 2 petang kekal tinggi", () => {
    const now = at("2026-10-12T15:12");
    const notes = planNotifications(
      on(false, false, true),
      [withSchool([160, 158, 172])],
      now,
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      title: "IPU di Shah Alam kekal tinggi (172)",
      body: "Semak pengumuman sekolah untuk esok.",
      tag: "hezy-sekolah-semasa",
    });
    const sent = applySent(on(false, false, true), notes[0].update, now);
    expect(sent.locations[0].lastSchool).toBe("2026-10-12");
    expect(
      planNotifications(
        sent,
        [withSchool([160, 158, 172])],
        at("2026-10-12T17:12"),
      ),
    ).toEqual([]);
  });

  it("tidak dihantar sebelum 3 petang, bila dimatikan, atau baru satu hari tinggi", () => {
    expect(
      planNotifications(
        on(false, false, true),
        [withSchool([160, 158, 172])],
        at("2026-10-12T14:12"),
      ),
    ).toEqual([]);
    expect(
      planNotifications(
        on(false, false, false),
        [withSchool([160, 158, 172])],
        at("2026-10-12T15:12"),
      ),
    ).toEqual([]);
    expect(
      planNotifications(
        on(false, false, true),
        [withSchool([null, 140, 160])],
        at("2026-10-12T15:12"),
      ),
    ).toEqual([]);
  });
});
