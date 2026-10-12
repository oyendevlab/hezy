"use client";

import { useId, useState } from "react";
import { formatHour } from "@/lib/format";
import { ipuCategory } from "@/lib/ipu";
import { displayIpu } from "@/lib/official";
import type { Prefs, SavedLocation } from "@/lib/prefs";
import { useHourScrub } from "@/lib/use-hour-scrub";
import { useI18n } from "@/lib/use-i18n";
import { useReading } from "@/lib/use-reading";

const MAX_SELECTED = 3;
/** Warna garis: berbeza hue dan kecerahan supaya boleh dibezakan tanpa bergantung pada warna sahaja. */
const SERIES = [
  { color: "#1d4ed8", dash: "" },
  { color: "#c2410c", dash: "" },
  { color: "#6d28d9", dash: "" },
] as const;

const W = 720;
const H = 240;
const LEFT = 40;
const RIGHT = 12;
const TOP = 12;
const BOTTOM = 28;
const SCALE_MAX = 200;
const x = (i: number) => LEFT + (i / 23) * (W - LEFT - RIGHT);
const y = (v: number) =>
  TOP + (1 - Math.min(v, SCALE_MAX) / SCALE_MAX) * (H - TOP - BOTTOM);

/** Calon lokasi: semasa + kegemaran, tanpa pendua. */
function candidates(prefs: Prefs): SavedLocation[] {
  const list: SavedLocation[] = prefs.current ? [prefs.current] : [];
  for (const f of prefs.favourites) {
    if (
      !list.some((l) => l.id === f.id || (l.lat === f.lat && l.lon === f.lon))
    )
      list.push(f);
  }
  return list.slice(0, 6);
}

/** Bandingkan graf IPU hari ini bagi 2–3 lokasi (desktop sahaja). */
export function CompareLocations({ prefs }: { prefs: Prefs }) {
  const { t, lang } = useI18n();
  const options = candidates(prefs);
  const [selected, setSelected] = useState<string[]>(() =>
    options.slice(0, 2).map((l) => l.id),
  );
  const chosen = options
    .filter((l) => selected.includes(l.id))
    .slice(0, MAX_SELECTED);
  // Jam semasa dan label jam diambil daripada bacaan lokasi pertama.
  const first = useReading(chosen[0] ?? null).entry?.reading?.today ?? [];
  const nowIndex = first.findLastIndex((h) => !h.forecast);
  const scrub = useHourScrub(24, nowIndex, (frac) =>
    Math.round(((frac * W - LEFT) / (W - LEFT - RIGHT)) * 23),
  );
  const hourLabel = first[scrub.index]
    ? formatHour(first[scrub.index].time, lang)
    : "";
  const captionId = useId();

  if (options.length < 2) {
    return (
      <section
        aria-labelledby="bandingkan"
        className="border-line rounded-3xl border p-5"
      >
        <h2 id="bandingkan" className="font-display text-xl font-bold">
          {t("Bandingkan lokasi")}
        </h2>
        <p className="text-muted mt-1 text-sm">
          {t(
            "Simpan sekurang-kurangnya satu lokasi kegemaran untuk membandingkan trend.",
          )}
        </p>
      </section>
    );
  }

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id)
        ? s.filter((x) => x !== id)
        : s.length >= MAX_SELECTED
          ? s
          : [...s, id],
    );

  return (
    <section
      aria-labelledby="bandingkan"
      className="border-line flex flex-col gap-4 rounded-3xl border p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="bandingkan" className="font-display text-xl font-bold">
          {t("Bandingkan lokasi")}
        </h2>
        <span className="text-muted text-xs font-semibold">
          {t("Pilih sehingga {max}", { max: MAX_SELECTED })}
        </span>
      </div>

      <div
        role="group"
        aria-label={t("Lokasi untuk dibandingkan")}
        className="flex flex-wrap gap-2"
      >
        {options.map((l) => {
          const on = selected.includes(l.id);
          const index = chosen.findIndex((c) => c.id === l.id);
          return (
            <button
              key={l.id}
              type="button"
              aria-pressed={on}
              disabled={!on && selected.length >= MAX_SELECTED}
              onClick={() => toggle(l.id)}
              className={`flex min-h-10 items-center gap-2 rounded-full border-[1.5px] px-3.5 text-sm font-semibold disabled:opacity-40 ${
                on ? "border-ink" : "border-line text-muted"
              }`}
            >
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{
                  background:
                    on && index >= 0 ? SERIES[index].color : "var(--line)",
                }}
              />
              {t(l.name)}
            </button>
          );
        })}
      </div>

      <figure className="m-0">
        <div
          role="slider"
          tabIndex={0}
          aria-label={t("Graf perbandingan IPU hari ini")}
          aria-describedby={captionId}
          aria-valuemin={0}
          aria-valuemax={23}
          aria-valuenow={scrub.index}
          aria-valuetext={hourLabel}
          {...scrub.handlers}
          className="focus-visible:outline-ink cursor-crosshair touch-pan-y rounded-md select-none focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
          >
            {[0, 50, 100, 150, 200].map((v) => (
              <g key={v}>
                <line
                  x1={LEFT}
                  x2={W - RIGHT}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="var(--line)"
                  strokeWidth="1"
                />
                <text
                  x={LEFT - 8}
                  y={y(v) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="var(--muted)"
                >
                  {v}
                </text>
              </g>
            ))}
            {[0, 6, 12, 18, 23].map((h) => (
              <text
                key={h}
                x={x(h)}
                y={H - 8}
                textAnchor="middle"
                fontSize="11"
                fill="var(--muted)"
              >
                {t(
                  h === 0
                    ? "12 pg"
                    : h === 6
                      ? "6 pg"
                      : h === 12
                        ? "12 tgh"
                        : h === 18
                          ? "6 ptg"
                          : "11 mlm",
                )}
              </text>
            ))}
            {chosen.map((l, i) => (
              <SeriesLine key={l.id} location={l} color={SERIES[i].color} />
            ))}
            <line
              x1={x(scrub.index)}
              x2={x(scrub.index)}
              y1={TOP}
              y2={H - BOTTOM}
              stroke="var(--ink)"
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity="0.45"
            />
            {chosen.map((l, i) => (
              <SeriesDot
                key={l.id}
                location={l}
                color={SERIES[i].color}
                index={scrub.index}
              />
            ))}
          </svg>
        </div>
        <figcaption id={captionId}>
          <div className="mb-1 flex flex-wrap items-baseline gap-x-3 text-sm font-bold">
            {hourLabel}
            {scrub.index === nowIndex && (
              <span className="bg-ink text-page rounded-full px-2 py-0.5 text-[11px]">
                {t("Kini")}
              </span>
            )}
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {chosen.map((l, i) => (
              <SeriesLegend
                key={l.id}
                location={l}
                color={SERIES[i].color}
                index={scrub.index}
              />
            ))}
          </ul>
          <p className="text-muted mt-2 text-xs">
            {t(
              "Garis penuh: jam lepas (rasmi APIMS jika ada). Garis putus: ramalan model.",
            )}
          </p>
        </figcaption>
      </figure>
    </section>
  );
}

function points(values: { i: number; v: number | null }[]) {
  return values
    .filter((p): p is { i: number; v: number } => p.v !== null)
    .map((p) => `${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`)
    .join(" ");
}

function SeriesLine({
  location,
  color,
}: {
  location: SavedLocation;
  color: string;
}) {
  const { entry } = useReading(location);
  const today = entry?.reading?.today;
  if (!today?.length) return null;
  const nowIndex = today.findLastIndex((h) => !h.forecast);
  const values = today.map((h, i) => ({
    i,
    v: displayIpu(h),
    forecast: h.forecast,
  }));
  const past = values.filter((p) => p.i <= nowIndex);
  const future = values.filter((p) => p.i >= nowIndex);
  return (
    <g>
      <polyline
        points={points(past)}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={points(future)}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray="6 6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Titik nilai pada jam yang dipilih. */
function SeriesDot({
  location,
  color,
  index,
}: {
  location: SavedLocation;
  color: string;
  index: number;
}) {
  const hour = useReading(location).entry?.reading?.today?.[index];
  const value = hour ? displayIpu(hour) : null;
  if (value === null) return null;
  return (
    <circle
      cx={x(index)}
      cy={y(value)}
      r="6"
      fill={color}
      stroke="var(--page)"
      strokeWidth="2"
    />
  );
}

function SeriesLegend({
  location,
  color,
  index,
}: {
  location: SavedLocation;
  color: string;
  index: number;
}) {
  const { t } = useI18n();
  const { entry } = useReading(location);
  const hour = entry?.reading?.today?.[index];
  const value = hour ? displayIpu(hour) : null;
  const loading = !entry?.reading;
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-1 w-5 rounded-full"
        style={{ background: color }}
      />
      <span className="font-semibold">{t(location.name)}</span>
      <span className="text-muted">
        {loading
          ? t("memuatkan…")
          : value === null
            ? t("Tiada data")
            : `${t("IPU {threshold}", { threshold: value })} · ${t(ipuCategory(value).label)}`}
      </span>
    </li>
  );
}
