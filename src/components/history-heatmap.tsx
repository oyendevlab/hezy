"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { formatMonth, formatShortDate } from "@/lib/format";
import { toWeeks, type HistoryDay } from "@/lib/history";
import { IPU_CATEGORIES, ipuCategory } from "@/lib/ipu";
import { useI18n } from "@/lib/use-i18n";
import { IpuPill } from "./ipu-pill";
import { Skeleton } from "./status";

type HistoryResponse = {
  station: string;
  today: string;
  first: string | null;
  days: HistoryDay[];
};

const cache = new Map<string, HistoryResponse>();

/** Julat legenda ikut kategori APIMS. */
const RANGES: Record<string, string> = {
  baik: "0–50",
  sederhana: "51–100",
  "tidak-sihat": "101–200",
  "sangat-tidak-sihat": "201–300",
  berbahaya: "> 300",
};

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
        <h2 id="sejarah-ipu" className="font-display text-xl font-bold">
          {t("Sejarah 12 minggu")}
        </h2>
        <span className="text-muted text-xs font-semibold">
          {t("IPU maks harian · Stesen {station}", { station: stationName })}
        </span>
      </div>

      <div className="flex gap-1.5">
        <div
          aria-hidden="true"
          className="text-muted grid grid-rows-[14px_repeat(7,minmax(0,1fr))] gap-[3px] text-[10px] font-semibold"
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
          className="grid min-w-0 flex-1 grid-flow-col grid-rows-[14px_repeat(7,minmax(0,1fr))] gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
          }}
        >
          {weeks.map((week, w) => {
            // Label bulan pada minggu pertama dan minggu yang mengandungi awal bulan.
            const monthDay =
              w === 0
                ? week.find((d) => d)
                : week.find((d) => d && Number(d.date.slice(8, 10)) <= 7);
            return [
              <span
                key={`m${w}`}
                aria-hidden="true"
                className="text-muted overflow-visible text-[10px] leading-none font-semibold whitespace-nowrap"
              >
                {monthDay ? formatMonth(monthDay.date, lang) : ""}
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
                    className={`aspect-square w-full rounded-[3px] ${
                      d.date === day.date
                        ? "outline-ink outline-2 outline-offset-1"
                        : ""
                    }`}
                    style={{
                      background:
                        d.max === null
                          ? "var(--line)"
                          : CATEGORY_STYLE[ipuCategory(d.max).key].accent,
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
        className="bg-surface flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-4 py-2.5 text-sm"
      >
        <span className="font-bold">
          {formatShortDate(day.date, lang)}
          {day.date === data.today ? ` ${t("(setakat ini)")}` : ""}
        </span>
        {day.max === null ? (
          <span className="text-muted">{t("Tiada data")}</span>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              {t("Maks")}
              <span className="font-display text-xl font-bold">{day.max}</span>
              <IpuPill
                category={ipuCategory(day.max).key}
                label={t(ipuCategory(day.max).label)}
                className="!px-2 !py-0.5 !text-xs"
              />
            </span>
            <span className="text-muted text-xs font-semibold">
              {t("Purata {avg} · {hours} jam data", {
                avg: day.avg ?? "–",
                hours: day.hours,
              })}
            </span>
          </>
        )}
      </div>

      <ul
        aria-label={t("Petunjuk warna (kategori IPU APIMS)")}
        className="text-muted flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-semibold"
      >
        {IPU_CATEGORIES.map((c) => (
          <li key={c.key} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-3 rounded-[3px]"
              style={{ background: CATEGORY_STYLE[c.key].accent }}
            />
            {t(c.label)} {RANGES[c.key]}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="bg-line size-3 rounded-[3px]" />
          {t("Tiada data")}
        </li>
      </ul>
      <p className="text-muted text-xs">
        {t(
          "Warna ikut IPU maksimum harian dan kategori APIMS (JAS). IPU melebihi 500 ialah tahap Kecemasan.",
        )}{" "}
        {data.first
          ? t("Data dikumpul sejak {date} ({count} hari).", {
              date: formatShortDate(data.first, lang),
              count: withData,
            })
          : t("Data sedang dikumpul; heatmap akan terisi dari hari ke hari.")}
      </p>
    </section>
  );
}
