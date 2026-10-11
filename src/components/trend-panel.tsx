import { CATEGORY_STYLE } from "@/lib/category-style";
import { formatHour, formatWindow } from "@/lib/format";
import { ipuCategory } from "@/lib/ipu";
import type { HourPoint, Reading } from "@/lib/reading";
import { HourBars } from "./hour-bars";

function average(hours: HourPoint[], from: number, to: number): number | null {
  const values = hours
    .filter((h) => {
      const hour = Number(h.time.slice(11, 13));
      return hour >= from && hour < to;
    })
    .map((h) => h.hourlyIpu)
    .filter((v): v is number => v !== null);
  return values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : null;
}

/** Masa terbaik keluar + graf 24 jam + purata pagi/petang/malam (mockup G). */
export function TrendPanel({
  reading,
  barHeight = 150,
}: {
  reading: Reading;
  barHeight?: number;
}) {
  const { today, bestWindow } = reading;
  const todayDate = today[0]?.time.slice(0, 10) ?? "";
  const lastPast = today.findLast((h) => !h.forecast);
  const bestCategory = bestWindow ? ipuCategory(bestWindow.averageIpu) : null;
  const blocks = [
    { name: "Pagi", span: "6 pg – 12 tgh", value: average(today, 6, 12) },
    { name: "Petang", span: "12 tgh – 6 ptg", value: average(today, 12, 18) },
    { name: "Malam", span: "6 ptg – 12 mlm", value: average(today, 18, 24) },
  ];

  return (
    <div className="flex flex-col gap-4">
      {bestWindow && bestCategory && (
        <div
          className={`rounded-[22px] p-4.5 ${CATEGORY_STYLE[bestCategory.key].tint}`}
        >
          <div className="text-[13px] font-bold tracking-wide">
            MASA TERBAIK UNTUK KELUAR
          </div>
          <div className="font-display mt-1 text-[34px] leading-tight font-bold">
            {formatWindow(bestWindow.start, bestWindow.end, todayDate)}
          </div>
          <div className="mt-1 text-sm font-semibold">
            Anggaran IPU ~{bestWindow.averageIpu} · {bestCategory.label}
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-bold">
            Hari ini, jam demi jam
          </h2>
          {lastPast && (
            <span className="text-muted text-xs font-semibold">
              Selepas {formatHour(lastPast.time)}: ramalan
            </span>
          )}
        </div>
        <div className="mt-3">
          <HourBars hours={today} height={barHeight} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {blocks.map((b) => (
          <div key={b.name} className="bg-surface rounded-2xl p-3">
            <div className="text-sm font-bold">{b.name}</div>
            <div className="text-muted text-[11px] font-medium">{b.span}</div>
            <div className="font-display mt-1 text-2xl font-bold">
              {b.value ?? "–"}
            </div>
            <div
              className="mt-1 h-1.5 rounded-full"
              style={{
                background:
                  b.value === null
                    ? "var(--line)"
                    : CATEGORY_STYLE[ipuCategory(b.value).key].accent,
              }}
            />
          </div>
        ))}
      </div>

      <p className="text-muted text-xs">
        Graf dan masa terbaik menggunakan IPU sejam, iaitu formula JAS pada
        PM2.5 setiap jam. Nombor IPU utama menggunakan purata 24 jam.
      </p>
    </div>
  );
}
