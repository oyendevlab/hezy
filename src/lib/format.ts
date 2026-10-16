/** Format masa dan perubahan dalam BM (lalai) atau EN. Input masa: `YYYY-MM-DDTHH:mm` waktu Malaysia. */

import type { Lang } from "./i18n";

const hourOf = (time: string) => Number(time.slice(11, 13));

/** AM/PM dalam kedua-dua bahasa (v0.7.15): pendek dan seragam lebarnya. */
function period(hour: number): string {
  return hour < 12 ? "AM" : "PM";
}

const clockHour = (hour: number) => (hour % 12 === 0 ? 12 : hour % 12);

/** "2026-10-11T22:00" → "10 PM" */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- API kekal; format sama dalam kedua-dua bahasa.
export function formatHour(time: string, _lang: Lang = "ms"): string {
  const hour = hourOf(time);
  return `${clockHour(hour)} ${period(hour)}`;
}

/** "2026-10-11T22:00" → "10:00 PM" */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- API kekal; format sama dalam kedua-dua bahasa.
export function formatClock(time: string, _lang: Lang = "ms"): string {
  const hour = hourOf(time);
  return `${clockHour(hour)}:${time.slice(14, 16)} ${period(hour)}`;
}

/**
 * Julat jam, cth. "5 – 7 AM" atau "11 PM – 1 AM". Hujung julat ialah
 * jam terakhir tetingkap; `today` (YYYY-MM-DD) menambah "esok" bila perlu.
 */
export function formatWindow(
  start: string,
  end: string,
  today: string,
  lang: Lang = "ms",
): string {
  const a = hourOf(start);
  const b = hourOf(end);
  const range =
    period(a) === period(b)
      ? `${clockHour(a)} – ${clockHour(b)} ${period(b)}`
      : `${formatHour(start, lang)} – ${formatHour(end, lang)}`;
  if (start.slice(0, 10) === today) return range;
  return `${lang === "en" ? "Tomorrow" : "Esok"}, ${range}`;
}

export function formatChange(
  change: number | null,
  lang: Lang = "ms",
): string | null {
  if (change === null) return null;
  if (lang === "en") {
    if (change === 0) return "Steady over 3 hours";
    return `${change > 0 ? "Up" : "Down"} ${Math.abs(change)} in 3 hours`;
  }
  if (change === 0) return "Stabil dalam 3 jam";
  return `${change > 0 ? "Naik" : "Turun"} ${Math.abs(change)} dalam 3 jam`;
}

const DAY_NAMES: Record<Lang, string[]> = {
  ms: ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

/** "2026-10-13" → "Esok" (jika hari selepas `today`) atau "Sel 13/10". */
export function formatDay(
  date: string,
  today: string,
  lang: Lang = "ms",
): string {
  const d = new Date(`${date}T00:00:00Z`);
  const t = new Date(`${today}T00:00:00Z`);
  if (d.getTime() - t.getTime() === 86_400_000)
    return lang === "en" ? "Tomorrow" : "Esok";
  return `${DAY_NAMES[lang][d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

const MONTH_NAMES: Record<Lang, string[]> = {
  ms: [
    "Jan",
    "Feb",
    "Mac",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Ogo",
    "Sep",
    "Okt",
    "Nov",
    "Dis",
  ],
  en: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
};

/** Nama bulan ringkas bagi tarikh `YYYY-MM-DD`. */
export function formatMonth(date: string, lang: Lang = "ms"): string {
  return MONTH_NAMES[lang][Number(date.slice(5, 7)) - 1];
}

/** "2026-10-12" → "Isn 12 Okt" / "Mon 12 Oct". */
export function formatShortDate(date: string, lang: Lang = "ms"): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${DAY_NAMES[lang][d.getUTCDay()]} ${d.getUTCDate()} ${formatMonth(date, lang)}`;
}

const DAY_NAMES_LONG: Record<Lang, string[]> = {
  ms: ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"],
  en: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
};

const MONTH_NAMES_LONG: Record<Lang, string[]> = {
  ms: [
    "Januari",
    "Februari",
    "Mac",
    "April",
    "Mei",
    "Jun",
    "Julai",
    "Ogos",
    "September",
    "Oktober",
    "November",
    "Disember",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

/** "2026-10-15" → { weekday: "Khamis", date: "15 Oktober 2026" } (v0.7.5). */
export function formatLongDate(
  date: string,
  lang: Lang = "ms",
): { weekday: string; date: string } {
  const d = new Date(`${date}T00:00:00Z`);
  return {
    weekday: DAY_NAMES_LONG[lang][d.getUTCDay()],
    date: `${d.getUTCDate()} ${MONTH_NAMES_LONG[lang][d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  };
}

/** Cap masa waktu Malaysia, cth. "16 Okt · 2:15 PM" (masa imej kongsi dijana, v0.7.15). */
export function formatStamp(date: Date, lang: Lang = "ms"): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const iso = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  return `${Number(parts.day)} ${formatMonth(iso.slice(0, 10), lang)} · ${formatClock(iso, lang)}`;
}
