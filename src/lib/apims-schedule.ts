/**
 * Cache senarai stesen ikut jadual terbitan APIMS (v0.8.5, docs/AUDIT-0.8.md D2).
 *
 * APIMS menerbitkan bacaan jam H dalam jam yang sama (diperhatikan 16 Okt 2026: belum ada pada
 * H:08, sudah ada pada H:42). Bila bacaan jam semasa belum terbit, semak setiap 2 minit supaya
 * nombor baharu sampai cepat; selepas terbit, tunggu hingga beberapa minit selepas jam berikutnya.
 */

import type { Station } from "./apims";
import { localHourKey } from "./reading";

/** Tempoh cache (saat) bila bacaan jam semasa dijangka terbit. */
export const DUE_REVALIDATE_SECONDS = 120;
/** Minit selepas jam baharu sebelum mula menyemak semula. */
export const PUBLISH_DELAY_MINUTES = 8;

/** Saat sehingga senarai stesen patut diambil semula. */
export function stationsRevalidateSeconds(
  stations: readonly Pick<Station, "time">[],
  now: Date,
): number {
  let latest: string | null = null;
  for (const s of stations)
    if (s.time && (!latest || s.time > latest)) latest = s.time;
  const currentHour = localHourKey(now).slice(0, 13);
  if (!latest || latest.slice(0, 13) < currentHour)
    return DUE_REVALIDATE_SECONDS;
  // Waktu Malaysia ialah UTC+8 (tanpa DST), jadi minit dalam jam sama seperti UTC.
  const intoHour = now.getUTCMinutes() * 60 + now.getUTCSeconds();
  const untilNext = 3600 - intoHour + PUBLISH_DELAY_MINUTES * 60;
  return Math.min(3600, Math.max(300, untilNext));
}

/** Bacaan jam semasa belum terbit (cache pendek untuk CDN juga). */
export function stationsDue(
  stations: readonly Pick<Station, "time">[],
  now: Date,
): boolean {
  return stationsRevalidateSeconds(stations, now) === DUE_REVALIDATE_SECONDS;
}
