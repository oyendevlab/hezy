/** Format masa dan perubahan dalam Bahasa Melayu. Input masa: `YYYY-MM-DDTHH:mm` waktu Malaysia. */

const hourOf = (time: string) => Number(time.slice(11, 13));

type Period = "pagi" | "tengah hari" | "petang" | "malam" | "tengah malam";

function period(hour: number): Period {
  if (hour === 0) return "tengah malam";
  if (hour < 12) return "pagi";
  if (hour === 12) return "tengah hari";
  if (hour < 19) return "petang";
  return "malam";
}

const clockHour = (hour: number) => (hour % 12 === 0 ? 12 : hour % 12);

/** "2026-10-11T22:00" → "10 malam" */
export function formatHour(time: string): string {
  const hour = hourOf(time);
  return `${clockHour(hour)} ${period(hour)}`;
}

/** "2026-10-11T22:00" → "10:00 malam" */
export function formatClock(time: string): string {
  const hour = hourOf(time);
  return `${clockHour(hour)}:${time.slice(14, 16)} ${period(hour)}`;
}

/**
 * Julat jam, cth. "5 – 7 pagi" atau "11 malam – 1 pagi". Hujung julat ialah
 * jam terakhir tetingkap; `today` (YYYY-MM-DD) menambah "esok" bila perlu.
 */
export function formatWindow(
  start: string,
  end: string,
  today: string,
): string {
  const a = hourOf(start);
  const b = hourOf(end);
  const range =
    period(a) === period(b)
      ? `${clockHour(a)} – ${clockHour(b)} ${period(b)}`
      : `${formatHour(start)} – ${formatHour(end)}`;
  return start.slice(0, 10) === today ? range : `Esok, ${range}`;
}

export function formatChange(change: number | null): string | null {
  if (change === null) return null;
  if (change === 0) return "Stabil dalam 3 jam";
  return `${change > 0 ? "Naik" : "Turun"} ${Math.abs(change)} dalam 3 jam`;
}
