/**
 * Rancang notifikasi bagi satu langganan pada semakan setiap jam (item 5, 6, 7).
 * Fungsi tulen: route /api/push/check menghantar dan menyimpan perubahan.
 */

import { adviceFor } from "./advice";
import { decideAlert, type AlertState } from "./alert";
import { formatHour, formatWindow } from "./format";
import { addDays } from "./history";
import { translate } from "./i18n";
import { ipuCategory } from "./ipu";
import { displayIpu, primaryReading } from "./official";
import type { PushRecord } from "./push-record";
import { LEGACY_OPTIONS } from "./push-validate";
import { localHourKey, type HourPoint, type Reading } from "./reading";
import { schoolPersistentHigh } from "./school";

/** IPU melebihi nilai ini tetap dihantar walaupun dalam waktu senyap. */
export const QUIET_OVERRIDE_IPU = 300;
/** Ringkasan pagi: dari jam 7 hingga sebelum 11 (sekali sehari). */
export const MORNING_HOURS = [7, 11] as const;
/** Amaran ramalan esok: dari jam 8 malam hingga sebelum 11 malam (sekali sehari). */
export const FORECAST_HOURS = [20, 23] as const;

/** Lonjakan: kenaikan sekurang-kurangnya ini dalam SPIKE_HOURS jam (v0.7.0 item 9). */
export const SPIKE_RISE = 30;
export const SPIKE_HOURS = 3;
/** Lonjakan hanya bila IPU sekarang melebihi ini (abaikan turun naik dalam tahap Baik). */
export const SPIKE_MIN_IPU = 50;
/** Satu amaran lonjakan bagi setiap lokasi dalam tempoh ini. */
export const SPIKE_COOLDOWN_HOURS = 6;
/** Jerebu dijangka: tetingkap ramalan ke hadapan (v0.7.0 item 10). */
export const EXPECTED_HOURS = 6;

/** Notifikasi sekolah esok: dari 3 petang (bacaan jam 2 tersedia) hingga sebelum 9 malam. */
export const SCHOOL_HOURS = [15, 21] as const;

export type PlannedUpdate =
  | { kind: "alert"; index: number; next: AlertState }
  | { kind: "forecast"; index: number }
  | { kind: "spike"; index: number }
  | { kind: "expected"; index: number }
  | { kind: "school"; index: number }
  | { kind: "morning" };

/** Milisaat bagi kunci jam `YYYY-MM-DDTHH:mm` (waktu tempatan dianggap UTC; hanya untuk beza). */
const keyMs = (key: string) => Date.parse(`${key}:00Z`);

/**
 * Lonjakan IPU: nilai jam terkini berbanding SPIKE_HOURS jam sebelumnya (rasmi APIMS jika ada).
 * `null` jika data tidak cukup atau kenaikan kurang daripada SPIKE_RISE.
 */
export function detectSpike(
  today: readonly HourPoint[],
): { from: number; to: number } | null {
  const past = today.filter((h) => !h.forecast && displayIpu(h) !== null);
  const last = past.at(-1);
  if (!last) return null;
  const target = keyMs(last.time) - SPIKE_HOURS * 3_600_000;
  const before = past.find((h) => keyMs(h.time) === target);
  if (!before) return null;
  const to = displayIpu(last)!;
  const from = displayIpu(before)!;
  return to - from >= SPIKE_RISE && to > SPIKE_MIN_IPU ? { from, to } : null;
}

/**
 * Jerebu dijangka: jam ramalan pertama dalam EXPECTED_HOURS jam selepas `nowKey` yang
 * melepasi ambang. `null` jika tiada.
 */
export function detectExpected(
  today: readonly HourPoint[],
  threshold: number,
  nowKey: string,
): { ipu: number; time: string } | null {
  const now = keyMs(nowKey);
  const limit = now + EXPECTED_HOURS * 3_600_000;
  for (const h of today) {
    if (!h.forecast) continue;
    const t = keyMs(h.time);
    if (t <= now || t > limit) continue;
    const v = displayIpu(h);
    if (v !== null && v > threshold) return { ipu: v, time: h.time };
  }
  return null;
}

export type Planned = {
  title: string;
  body: string;
  tag: string;
  urgency: "normal" | "high";
  update: PlannedUpdate;
  /**
   * Lencana ikon aplikasi: IPU semasa lokasi pertama bila pilihan "Nombor IPU pada ikon"
   * hidup (v0.7.8); tiada = tidak diubah.
   */
  badge?: number | null;
};

export function inQuietHours(
  hour: number,
  quiet: { start: number; end: number } | null,
): boolean {
  if (!quiet) return false;
  return quiet.start < quiet.end
    ? hour >= quiet.start && hour < quiet.end
    : hour >= quiet.start || hour < quiet.end;
}

export function planNotifications(
  record: PushRecord,
  readings: readonly (Reading | null)[],
  now: Date,
): Planned[] {
  const lang = record.lang ?? "ms";
  const t = (text: string, vars?: Record<string, string | number>) =>
    translate(lang, text, vars);
  const options = record.options ?? LEGACY_OPTIONS;
  const nowKey = localHourKey(now);
  const hour = Number(nowKey.slice(11, 13));
  const today = nowKey.slice(0, 10);
  const quiet = inQuietHours(hour, options.quiet);
  const planned: Planned[] = [];

  record.locations.forEach((location, index) => {
    const reading = readings[index];
    const primary = primaryReading(reading ?? undefined);
    if (!reading || !primary) return;
    const name = t(location.name);

    // Amaran ambang (ditangguh semasa waktu senyap kecuali sangat tinggi).
    if (!quiet || primary.ipu > QUIET_OVERRIDE_IPU) {
      const decision = decideAlert(
        location,
        primary,
        location.name,
        now,
        record.threshold,
        lang,
      );
      if (decision.send) {
        planned.push({
          title: decision.title,
          body: decision.body,
          tag: `hezy-ipu-${location.id}`,
          urgency: primary.ipu > 200 ? "high" : "normal",
          update: { kind: "alert", index, next: decision.next },
        });
      }
    }

    // Amaran lonjakan: naik mendadak tetapi masih di bawah ambang (amaran ambang mengendalikan selebihnya).
    if (options.spike && !quiet && primary.ipu <= record.threshold) {
      const spike = detectSpike(reading.today);
      const cooled =
        !location.lastSpike ||
        keyMs(nowKey) - keyMs(location.lastSpike) >=
          SPIKE_COOLDOWN_HOURS * 3_600_000;
      if (spike && cooled) {
        planned.push({
          title: t("IPU {name} naik mendadak: {from} → {to}", {
            name,
            from: spike.from,
            to: spike.to,
          }),
          body: `${t("Naik {rise} dalam {hours} jam.", {
            rise: spike.to - spike.from,
            hours: SPIKE_HOURS,
          })} ${t(adviceFor(ipuCategory(spike.to).key).headline)}`,
          tag: `hezy-lonjakan-${location.id}`,
          urgency: "normal",
          update: { kind: "spike", index },
        });
      }
    }

    // Amaran jerebu dijangka: ramalan 6 jam akan datang melepasi ambang (sekali sehari).
    if (
      options.expected &&
      !quiet &&
      primary.ipu <= record.threshold &&
      location.lastExpected !== today
    ) {
      const expected = detectExpected(reading.today, record.threshold, nowKey);
      if (expected) {
        const category = ipuCategory(expected.ipu);
        planned.push({
          title: t("Jerebu dijangka di {name} sekitar {time}", {
            name,
            time: formatHour(expected.time, lang),
          }),
          body: `${t(
            "Ramalan IPU ~{ipu} ({label}) dalam {hours} jam akan datang.",
            {
              ipu: expected.ipu,
              label: t(category.label),
              hours: EXPECTED_HOURS,
            },
          )} ${t(adviceFor(category.key).headline)}`,
          tag: `hezy-dijangka-${location.id}`,
          urgency: "normal",
          update: { kind: "expected", index },
        });
      }
    }

    // Bacaan jam 2 petang kekal tinggi: minta semak pengumuman sekolah (tanpa meramal penutupan).
    if (
      options.school &&
      !quiet &&
      hour >= SCHOOL_HOURS[0] &&
      hour < SCHOOL_HOURS[1] &&
      location.lastSchool !== today
    ) {
      const high = reading.schoolTwoPm
        ? schoolPersistentHigh(reading.schoolTwoPm)
        : null;
      if (high !== null) {
        planned.push({
          title: t("IPU di {name} kekal tinggi ({ipu})", { name, ipu: high }),
          body: t("Semak pengumuman sekolah untuk esok."),
          tag: `hezy-sekolah-${location.id}`,
          urgency: "normal",
          update: { kind: "school", index },
        });
      }
    }

    // Amaran ramalan esok.
    if (
      options.forecast &&
      !quiet &&
      hour >= FORECAST_HOURS[0] &&
      hour < FORECAST_HOURS[1] &&
      location.lastForecast !== today
    ) {
      const tomorrow = reading.days?.find((d) => d.date === addDays(today, 1));
      if (tomorrow && tomorrow.averageIpu > record.threshold) {
        const category = ipuCategory(tomorrow.averageIpu);
        planned.push({
          title: t("Esok di {name}: ramalan IPU {ipu} ({label})", {
            name,
            ipu: tomorrow.averageIpu,
            label: t(category.label),
          }),
          body: `${t("Puncak ~{max}.", { max: tomorrow.maxIpu })} ${t(adviceFor(category.key).headline)}`,
          tag: `hezy-esok-${location.id}`,
          urgency: "normal",
          update: { kind: "forecast", index },
        });
      }
    }
  });

  // Ringkasan pagi bagi lokasi pertama (lokasi semasa).
  const first = readings[0];
  const primary = primaryReading(first ?? undefined);
  if (
    options.morning &&
    !quiet &&
    hour >= MORNING_HOURS[0] &&
    hour < MORNING_HOURS[1] &&
    record.lastMorning !== today &&
    first &&
    primary &&
    record.locations[0]
  ) {
    const best = first.bestWindow;
    planned.push({
      title: t("Pagi ini di {name}: IPU {ipu} ({label})", {
        name: t(record.locations[0].name),
        ipu: primary.ipu,
        label: t(primary.label),
      }),
      body: [
        best
          ? t("Masa terbaik keluar: {window} (~{ipu}).", {
              window: formatWindow(best.start, best.end, today, lang),
              ipu: best.averageIpu,
            })
          : null,
        t(adviceFor(primary.category).headline),
      ]
        .filter(Boolean)
        .join(" "),
      tag: "hezy-pagi",
      urgency: "normal",
      update: { kind: "morning" },
    });
  }

  // Setiap notifikasi mengemas kini nombor pada ikon (iOS tidak membenarkan push senyap).
  const badge = primaryReading(readings[0] ?? undefined)?.ipu;
  return options.badge && badge !== undefined
    ? planned.map((p) => ({ ...p, badge }))
    : planned;
}

/** Simpan kesan notifikasi yang berjaya dihantar ke dalam rekod. */
export function applySent(
  record: PushRecord,
  update: PlannedUpdate,
  now: Date,
): PushRecord {
  const nowKey = localHourKey(now);
  const today = nowKey.slice(0, 10);
  if (update.kind === "morning") return { ...record, lastMorning: today };
  const locations = record.locations.map((l, i) => {
    if (i !== update.index) return l;
    switch (update.kind) {
      case "alert":
        return { ...l, ...update.next };
      case "spike":
        return { ...l, lastSpike: nowKey };
      case "expected":
        return { ...l, lastExpected: today };
      case "school":
        return { ...l, lastSchool: today };
      default:
        return { ...l, lastForecast: today };
    }
  });
  return { ...record, locations };
}
