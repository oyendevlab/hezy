/**
 * Rancang notifikasi bagi satu langganan pada semakan setiap jam (item 5, 6, 7).
 * Fungsi tulen: route /api/push/check menghantar dan menyimpan perubahan.
 */

import { adviceFor } from "./advice";
import { decideAlert, type AlertState } from "./alert";
import { formatWindow } from "./format";
import { addDays } from "./history";
import { translate } from "./i18n";
import { ipuCategory } from "./ipu";
import { primaryReading } from "./official";
import type { PushRecord } from "./push-record";
import { LEGACY_OPTIONS } from "./push-validate";
import { localHourKey, type Reading } from "./reading";

/** IPU melebihi nilai ini tetap dihantar walaupun dalam waktu senyap. */
export const QUIET_OVERRIDE_IPU = 300;
/** Ringkasan pagi: dari jam 7 hingga sebelum 11 (sekali sehari). */
export const MORNING_HOURS = [7, 11] as const;
/** Amaran ramalan esok: dari jam 8 malam hingga sebelum 11 malam (sekali sehari). */
export const FORECAST_HOURS = [20, 23] as const;

export type PlannedUpdate =
  | { kind: "alert"; index: number; next: AlertState }
  | { kind: "forecast"; index: number }
  | { kind: "morning" };

export type Planned = {
  title: string;
  body: string;
  tag: string;
  urgency: "normal" | "high";
  update: PlannedUpdate;
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

  return planned;
}

/** Simpan kesan notifikasi yang berjaya dihantar ke dalam rekod. */
export function applySent(
  record: PushRecord,
  update: PlannedUpdate,
  now: Date,
): PushRecord {
  const today = localHourKey(now).slice(0, 10);
  if (update.kind === "morning") return { ...record, lastMorning: today };
  const locations = record.locations.map((l, i) =>
    i !== update.index
      ? l
      : update.kind === "alert"
        ? { ...l, ...update.next }
        : { ...l, lastForecast: today },
  );
  return { ...record, locations };
}
