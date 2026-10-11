import { CATEGORY_STYLE } from "@/lib/category-style";
import { formatHour } from "@/lib/format";
import { ipuCategory } from "@/lib/ipu";
import type { HourPoint } from "@/lib/reading";

const SCALE_MAX = 200;

/** Graf bar IPU sejam bagi hari ini (mockup G). Jam lepas dipudarkan, jam semasa ditanda. */
export function HourBars({
  hours,
  height = 150,
}: {
  hours: HourPoint[];
  height?: number;
}) {
  const known = hours.filter(
    (h): h is HourPoint & { hourlyIpu: number } => h.hourlyIpu !== null,
  );
  const nowIndex = hours.findLastIndex((h) => !h.forecast);
  const peak = known.reduce<(typeof known)[number] | null>(
    (a, h) => (a && a.hourlyIpu >= h.hourlyIpu ? a : h),
    null,
  );
  const low = known.reduce<(typeof known)[number] | null>(
    (a, h) => (a && a.hourlyIpu <= h.hourlyIpu ? a : h),
    null,
  );
  const summary =
    peak && low
      ? `Graf IPU sejam hari ini. Tertinggi ${peak.hourlyIpu} pada ${formatHour(peak.time)}, terendah ${low.hourlyIpu} pada ${formatHour(low.time)}.`
      : "Graf IPU sejam hari ini. Data tidak mencukupi.";

  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={summary}
        className="flex items-end gap-[3px] md:gap-1"
        style={{ height }}
      >
        {hours.map((h, i) => {
          const value = h.hourlyIpu;
          const color =
            value === null
              ? "transparent"
              : CATEGORY_STYLE[ipuCategory(value).key].accent;
          return (
            <div
              key={h.time}
              title={
                value === null
                  ? undefined
                  : `${formatHour(h.time)} · IPU ${value}${h.forecast ? " (ramalan)" : ""}`
              }
              className={`flex-1 rounded-[4px] ${i < nowIndex ? "opacity-40" : ""} ${
                i === nowIndex ? "outline-ink outline-2 outline-offset-2" : ""
              }`}
              style={{
                height:
                  value === null
                    ? 4
                    : Math.max(
                        4,
                        Math.round(
                          (Math.min(value, SCALE_MAX) / SCALE_MAX) * height,
                        ),
                      ),
                background: value === null ? "var(--line)" : color,
              }}
            />
          );
        })}
      </div>
      <figcaption className="text-muted mt-1.5 flex justify-between text-[11px] font-semibold md:text-xs">
        <span>12 pg</span>
        <span>6 pg</span>
        <span>12 tgh</span>
        <span>6 ptg</span>
        <span>11 mlm</span>
      </figcaption>
    </figure>
  );
}
