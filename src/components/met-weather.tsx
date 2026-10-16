"use client";

import { CloudLightning, CloudSun } from "@phosphor-icons/react";
import { useId } from "react";
import { findState } from "@/lib/areas";
import { formatClock, formatDay } from "@/lib/format";
import type { MetReading } from "@/lib/metmalaysia";
import { useI18n } from "@/lib/use-i18n";

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

/** Ramalan rasmi MetMalaysia peringkat negeri, 3 hari (v0.8.6). */
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
  return (
    <section
      aria-labelledby={headingId}
      data-testid="met-forecast"
      className="flex flex-col gap-2.5"
    >
      <div>
        <h2
          id={headingId}
          className="font-display flex items-center gap-2 text-xl font-bold"
        >
          <CloudSun aria-hidden="true" size={22} weight="duotone" />
          {t("Ramalan rasmi MetMalaysia")}
        </h2>
        <p className="text-muted text-xs">
          {t("Negeri {state} · sumber data.gov.my", { state })}
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {met.forecast.slice(0, 3).map((d) => (
          <li
            key={d.date}
            className="bg-surface flex flex-col gap-1.5 rounded-2xl p-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">
                {d.date === todayDate
                  ? t("Hari ini")
                  : formatDay(d.date, todayDate, lang)}
              </span>
              {d.max !== null && d.min !== null && (
                <span className="text-sm tabular-nums">
                  <span className="font-semibold">{d.max}°</span>
                  <span className="text-muted">/{d.min}°</span>
                </span>
              )}
            </div>
            <p className="text-sm leading-snug">
              {t(d.summary)}
              {d.when && <span className="text-muted"> · {t(d.when)}</span>}
            </p>
            <dl className="text-muted grid grid-cols-3 gap-2 text-[11px] leading-snug">
              {(
                [
                  ["Pagi", d.morning],
                  ["Petang", d.afternoon],
                  ["Malam", d.night],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="font-semibold">{t(label)}</dt>
                  <dd>{t(value)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
