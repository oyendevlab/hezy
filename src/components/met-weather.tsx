"use client";

import {
  ClockClockwise,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  MapPin,
  SealCheck,
  Thermometer,
  type Icon,
} from "@phosphor-icons/react";
import { useId } from "react";
import { findState } from "@/lib/areas";
import { formatClock, formatDay } from "@/lib/format";
import { addDays } from "@/lib/history";
import {
  metCondition,
  type MetDay,
  type MetKind,
  type MetReading,
} from "@/lib/metmalaysia";
import { useI18n } from "@/lib/use-i18n";
import { InfoSheetButton } from "./info-sheet";

/** "Sehingga 12:00 AM, Esok" — hari ditambah bila tamat bukan hari ini. */
function untilText(
  validTo: string,
  todayDate: string,
  t: ReturnType<typeof useI18n>["t"],
  lang: ReturnType<typeof useI18n>["lang"],
) {
  const date = validTo.slice(0, 10);
  const clock = formatClock(validTo, lang);
  return t("Sehingga {time}", {
    time:
      date === todayDate
        ? clock
        : `${clock}, ${formatDay(date, todayDate, lang)}`,
  });
}

/** Amaran cuaca rasmi MetMalaysia bagi negeri lokasi (v0.8.6, dalam app sahaja). */
export function MetWarningCard({
  met,
  todayDate,
}: {
  met: MetReading | null | undefined;
  todayDate: string;
}) {
  const { t, lang } = useI18n();
  // Utama merender susun atur telefon dan desktop serentak: id tajuk mesti unik.
  const headingId = useId();
  if (!met || met.warnings.length === 0) return null;
  return (
    <section
      aria-labelledby={headingId}
      data-testid="met-warning"
      className="bg-surface flex flex-col gap-2.5 rounded-2xl p-4"
    >
      <h2
        id={headingId}
        className="font-display flex items-center gap-2 text-base font-bold"
      >
        <CloudLightning aria-hidden="true" size={22} weight="duotone" />
        {t("Amaran cuaca MetMalaysia")}
      </h2>
      <ul className="flex flex-col gap-2.5">
        {met.warnings.map((w) => (
          <li
            key={`${w.issued}-${w.title.ms}`}
            className="flex flex-col gap-0.5"
          >
            <p className="text-sm font-semibold">
              {lang === "en" ? w.title.en : w.title.ms}
            </p>
            <p className="text-sm leading-snug">
              {lang === "en" ? (w.area.en ?? w.area.ms) : w.area.ms}
            </p>
            <p className="text-muted text-xs">
              {untilText(w.validTo, todayDate, t, lang)}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-muted text-[11px]">
        {t("Sumber: MetMalaysia melalui data.gov.my")}
      </p>
    </section>
  );
}

const MET_LOOK: Record<MetKind, { icon: Icon; color: string }> = {
  storm: { icon: CloudLightning, color: "#5b6ee1" },
  rain: { icon: CloudRain, color: "#3a7bd5" },
  haze: { icon: CloudFog, color: "#b08a2e" },
  dry: { icon: CloudSun, color: "#e0a800" },
  other: { icon: Cloud, color: "#8a857c" },
};

/** Ikon keadaan MetMalaysia (warna sama seperti ikon cuaca lain); malam tanpa hujan = bulan. */
export function MetIcon({
  kind,
  night = false,
  size = 24,
}: {
  kind: MetKind;
  night?: boolean;
  size?: number;
}) {
  const look =
    kind === "dry" && night
      ? { icon: CloudMoon, color: "#6b7bb5" }
      : MET_LOOK[kind];
  const Glyph = look.icon;
  return (
    <Glyph aria-hidden="true" size={size} weight="duotone" color={look.color} />
  );
}

/** Label hari: Hari ini, Esok, Lusa, kemudian nama hari. */
function dayLabel(
  date: string,
  todayDate: string,
  t: ReturnType<typeof useI18n>["t"],
  lang: ReturnType<typeof useI18n>["lang"],
) {
  if (date === todayDate) return t("Hari ini");
  if (date === addDays(todayDate, 1)) return t("Esok");
  if (date === addDays(todayDate, 2)) return t("Lusa");
  return formatDay(date, todayDate, lang);
}

/** Satu hari: ringkasan berikon di kanan, pagi/petang/malam berikon di bawah. */
function MetDayCard({ day, label }: { day: MetDay; label: string }) {
  const { t } = useI18n();
  const summary = metCondition(day.summary);
  const detail = [
    ...summary.qualifiers.map((q) => t(q)),
    ...(day.when ? [t(day.when)] : []),
  ].join(" · ");
  const periods = [
    ["Pagi", day.morning, false],
    ["Petang", day.afternoon, false],
    ["Malam", day.night, true],
  ] as const;
  return (
    <li className="bg-surface flex flex-col gap-3 rounded-2xl p-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold">{label}</span>
        <div className="flex min-w-0 items-center gap-2.5 text-right">
          <div className="min-w-0">
            <p className="text-sm leading-tight font-semibold">
              {t(summary.main)}
            </p>
            {detail && (
              <p className="text-muted text-[11px] leading-tight">{detail}</p>
            )}
          </div>
          <MetIcon kind={summary.kind} size={30} />
        </div>
      </div>
      <dl className="border-line grid grid-cols-3 gap-2 border-t pt-3">
        {periods.map(([name, phrase, night]) => {
          const c = metCondition(phrase);
          return (
            <div
              key={name}
              className="flex flex-col items-center gap-1 text-center"
            >
              <dt className="text-muted text-[11px] font-semibold">
                {t(name)}
              </dt>
              <dd className="flex flex-col items-center gap-0.5">
                {phrase ? (
                  <>
                    <MetIcon kind={c.kind} night={night} size={24} />
                    <span className="text-xs leading-tight font-semibold">
                      {t(c.main)}
                    </span>
                    {c.qualifiers.length > 0 && (
                      <span className="text-muted text-[10px] leading-tight">
                        {c.qualifiers.map((q) => t(q)).join(" · ")}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-muted text-xs">–</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </li>
  );
}

/**
 * Ramalan rasmi MetMalaysia, 3 hari (v0.8.6; diseragamkan v0.8.9; ikut daerah atau tanah tinggi
 * sejak v0.8.11): tajuk + ⓘ seperti bahagian lain, lokasi ramalan dan sumber dalam helaian ⓘ,
 * suhu dalam Ramalan harian.
 */
export function MetForecast({
  met,
  todayDate,
}: {
  met: MetReading | null | undefined;
  todayDate: string;
}) {
  const { t, lang } = useI18n();
  const headingId = useId();
  if (!met || met.forecast.length === 0) return null;
  const state = findState(met.state)?.name ?? met.state;
  // Lokasi ramalan (v0.8.11): tanah tinggi atau daerah bila ada, jika tidak negeri.
  const where =
    met.area?.kind === "zone"
      ? t("Ramalan {name} (tanah tinggi), {state}", {
          name: met.area.name,
          state,
        })
      : met.area?.kind === "district"
        ? t("Ramalan daerah {name}, {state}", { name: met.area.name, state })
        : t("Ramalan negeri {state}, ikut lokasi anda", { state });
  return (
    <section
      aria-labelledby={headingId}
      data-testid="met-forecast"
      className="flex flex-col gap-2.5"
    >
      <div className="flex items-center gap-1">
        <h2 id={headingId} className="font-display text-xl font-bold">
          {t("Ramalan rasmi MetMalaysia")}
        </h2>
        <InfoSheetButton
          title={t("Ramalan rasmi MetMalaysia")}
          label={t("Tentang ramalan rasmi MetMalaysia")}
          testId="info-met"
          rows={[
            { icon: MapPin, text: where },
            {
              icon: SealCheck,
              text: "Sumber rasmi: Jabatan Meteorologi Malaysia (MetMalaysia) melalui data.gov.my",
            },
            {
              icon: ClockClockwise,
              text: "Dikemas kini oleh MetMalaysia setiap hari",
            },
            {
              icon: Thermometer,
              text: "Suhu min/maks rasmi dipaparkan dalam Ramalan harian",
            },
            {
              icon: CloudLightning,
              text: "Amaran ribut petir dan hujan lebat dipaparkan di Utama",
            },
          ]}
        />
      </div>
      <ul className="flex flex-col gap-2">
        {met.forecast.slice(0, 3).map((d) => (
          <MetDayCard
            key={d.date}
            day={d}
            label={dayLabel(d.date, todayDate, t, lang)}
          />
        ))}
      </ul>
    </section>
  );
}
