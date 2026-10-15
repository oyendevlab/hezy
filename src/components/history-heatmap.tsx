"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { formatLongDate, formatMonth, formatShortDate } from "@/lib/format";
import { monthLabelWeeks, toWeeks, type HistoryDay } from "@/lib/history";
import { IPU_CATEGORIES, ipuCategory, type IpuCategoryKey } from "@/lib/ipu";
import { useI18n } from "@/lib/use-i18n";
import { CalendarCheck, ChartBar, Palette } from "@phosphor-icons/react";
import { InfoSheetButton } from "./info-sheet";
import { IpuPill } from "./ipu-pill";
import { Skeleton } from "./status";

type HistoryResponse = {
  station: string;
  today: string;
  first: string | null;
  days: HistoryDay[];
};

const cache = new Map<string, HistoryResponse>();

/** Julat IPU setiap kategori untuk keamatan warna dalam kategori (v0.7.5). */
const RANGE: Record<IpuCategoryKey, [number, number]> = {
  baik: [0, 50],
  sederhana: [51, 100],
  "tidak-sihat": [101, 200],
  "sangat-tidak-sihat": [201, 300],
  berbahaya: [301, 500],
};

/**
 * Warna kotak: hue ikut kategori IPU (maksud tahap kekal), keamatan ikut nilai dalam
 * kategori — nilai rendah lebih cerah, tinggi lebih pekat (ala GitHub).
 */
function cellColor(max: number): string {
  const key = ipuCategory(max).key;
  const [lo, hi] = RANGE[key];
  const t = Math.min(Math.max((max - lo) / (hi - lo), 0), 1);
  const strength = Math.round(45 + 55 * t);
  return `color-mix(in srgb, ${CATEGORY_STYLE[key].accent} ${strength}%, var(--page))`;
}

/** Warna contoh legenda: dua keamatan (rendah, tinggi) bagi setiap kategori. */
const LEGEND = IPU_CATEGORIES.flatMap((c) => {
  const [lo, hi] = RANGE[c.key];
  return [lo + (hi - lo) * 0.15, hi].map((v) => ({
    key: `${c.key}-${v}`,
    color: cellColor(Math.round(v)),
  }));
});

/** Heatmap gaya GitHub: IPU maksimum harian stesen APIMS bagi 12 minggu. */
export function HistoryHeatmap({
  stationId,
  stationName,
}: {
  stationId: string;
  stationName: string;
}) {
  const { t, lang } = useI18n();
  const [data, setData] = useState<HistoryResponse | null>(
    () => cache.get(stationId) ?? null,
  );
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/history?station=${encodeURIComponent(stationId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as HistoryResponse;
      })
      .then((body) => {
        cache.set(stationId, body);
        if (!cancelled) {
          setData(body);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [stationId]);

  if (!data) {
    return failed ? null : <Skeleton className="h-56" />;
  }

  const days = data.days;
  const weeks = toWeeks(days);
  const months = monthLabelWeeks(weeks);
  const current = selected ?? data.today;
  const day = days.find((d) => d.date === current) ?? days[days.length - 1];
  const withData = days.filter((d) => d.max !== null).length;

  const move = (delta: number) => {
    const i = days.findIndex((d) => d.date === day.date);
    const next = days[Math.min(Math.max(i + delta, 0), days.length - 1)];
    setSelected(next.date);
    requestAnimationFrame(() =>
      grid.current
        ?.querySelector<HTMLButtonElement>(`[data-date="${next.date}"]`)
        ?.focus(),
    );
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      ArrowLeft: -7,
      ArrowRight: 7,
    };
    if (e.key in step) {
      e.preventDefault();
      move(step[e.key]);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      move(e.key === "Home" ? -days.length : days.length);
    }
  };

  const label = (d: HistoryDay) =>
    d.max === null
      ? `${formatShortDate(d.date, lang)}: ${t("Tiada data")}`
      : `${formatShortDate(d.date, lang)}: ${t("maks {max}, {label}", {
          max: d.max,
          label: t(ipuCategory(d.max).label),
        })}`;

  return (
    <section aria-labelledby="sejarah-ipu" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-1">
          <h2 id="sejarah-ipu" className="font-display text-xl font-bold">
            {t("Sejarah 12 minggu")}
          </h2>
          <InfoSheetButton
            title={t("Sejarah 12 minggu")}
            label={t("Tentang sejarah 12 minggu")}
            testId="info-history"
            rows={[
              {
                icon: ChartBar,
                text: "Setiap kotak ialah IPU maksimum satu hari di stesen APIMS terdekat",
              },
              {
                icon: Palette,
                text: "Warna ikut kategori APIMS (JAS); lebih pekat bila IPU lebih tinggi dalam kategori itu. IPU melebihi 500 ialah tahap Kecemasan.",
              },
              {
                icon: CalendarCheck,
                text: data.first
                  ? t("Data dikumpul sejak {date} ({count} hari).", {
                      date: formatShortDate(data.first, lang),
                      count: withData,
                    })
                  : t(
                      "Data sedang dikumpul; heatmap akan terisi dari hari ke hari.",
                    ),
              },
            ]}
          />
        </div>
        <span className="text-muted text-xs font-semibold">
          {t("IPU maks harian · Stesen {station}", { station: stationName })}
        </span>
      </div>

      <div className="flex gap-1.5">
        <div
          aria-hidden="true"
          className="text-muted grid grid-rows-[14px_repeat(7,18px)] gap-[3px] text-[10px] font-semibold"
        >
          <span />
          {[t("Isn"), "", t("Rab"), "", t("Jum"), "", ""].map((d, i) => (
            <span key={i} className="flex items-center leading-none">
              {d}
            </span>
          ))}
        </div>
        <div
          ref={grid}
          role="group"
          aria-label={t("Heatmap IPU harian, 12 minggu")}
          onKeyDown={onKeyDown}
          // Kotak kecil 18 px (ala GitHub), bukan sel yang melebar memenuhi lebar skrin.
          className="grid min-w-0 grid-flow-col grid-rows-[14px_repeat(7,18px)] gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${weeks.length}, 18px)`,
          }}
        >
          {weeks.map((week, w) => {
            return [
              <span
                key={`m${w}`}
                aria-hidden="true"
                className="text-muted overflow-visible text-[10px] leading-none font-semibold whitespace-nowrap"
              >
                {months[w] ? formatMonth(months[w], lang) : ""}
              </span>,
              ...week.map((d, i) =>
                d ? (
                  <button
                    key={d.date}
                    type="button"
                    data-date={d.date}
                    tabIndex={d.date === day.date ? 0 : -1}
                    aria-pressed={d.date === day.date}
                    aria-label={label(d)}
                    onClick={() => setSelected(d.date)}
                    className={`size-[18px] rounded-[4px] ${
                      d.date === day.date
                        ? "outline-ink outline-2 outline-offset-1"
                        : ""
                    }`}
                    style={{
                      background:
                        d.max === null
                          ? "color-mix(in srgb, var(--line) 55%, transparent)"
                          : cellColor(d.max),
                    }}
                  />
                ) : (
                  <span key={`e${w}-${i}`} aria-hidden="true" />
                ),
              ),
            ];
          })}
        </div>
      </div>

      <div
        aria-live="polite"
        data-testid="history-day"
        className="bg-surface flex min-h-16 items-center justify-between gap-3 rounded-2xl px-4 py-3"
      >
        <div className="min-w-0">
          <div className="font-display text-lg leading-tight font-bold">
            {formatLongDate(day.date, lang).weekday}
          </div>
          <div className="text-muted text-xs font-semibold">
            {formatLongDate(day.date, lang).date}
            {day.date === data.today ? ` ${t("(setakat ini)")}` : ""}
          </div>
        </div>
        {day.max === null ? (
          <span className="text-muted text-sm">{t("Tiada data")}</span>
        ) : (
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="flex items-center gap-1.5 text-sm">
              {t("Maks")}
              <span className="font-display text-xl leading-none font-bold">
                {day.max}
              </span>
              <IpuPill
                category={ipuCategory(day.max).key}
                label={t(ipuCategory(day.max).label)}
                className="!px-2 !py-0.5 !text-xs"
              />
            </span>
            {day.avg != null && (
              <span className="text-muted text-xs font-semibold">
                {t("Purata {avg}", { avg: day.avg })}
              </span>
            )}
          </div>
        )}
      </div>

      <div
        aria-label={t("Petunjuk warna: Baik hingga Berbahaya")}
        role="img"
        className="text-muted flex items-center gap-1.5 text-[11px] font-semibold"
      >
        <span>{t("Baik")}</span>
        <span className="flex gap-[3px]">
          {LEGEND.map((l) => (
            <span
              key={l.key}
              className="size-3 rounded-[3px]"
              style={{ background: l.color }}
            />
          ))}
        </span>
        <span>{t("Berbahaya")}</span>
        <span
          className="ml-2 size-3 rounded-[3px]"
          style={{
            background: "color-mix(in srgb, var(--line) 55%, transparent)",
          }}
        />
        <span>{t("Tiada data")}</span>
      </div>
    </section>
  );
}
