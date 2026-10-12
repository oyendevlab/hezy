"use client";

import type { Station } from "@/lib/apims";
import { formatClock } from "@/lib/format";
import { ipuCategory } from "@/lib/ipu";
import { useI18n } from "@/lib/use-i18n";
import { IpuPill } from "./ipu-pill";

/** Jadual IPU rasmi stesen APIMS, disusun dari IPU tertinggi. */
export function StationTable({
  stations,
  stateName,
}: {
  stations: Station[];
  stateName: string;
}) {
  const { t, lang } = useI18n();
  const caption = t("IPU rasmi stesen APIMS di {state}", { state: stateName });
  const sorted = [...stations].sort((a, b) => (b.ipu ?? -1) - (a.ipu ?? -1));
  return (
    <div
      // Boleh difokus supaya jadual yang ditatal mendatar boleh dicapai dengan papan kekunci.
      tabIndex={0}
      role="region"
      aria-label={caption}
      className="border-line focus-visible:outline-ink overflow-x-auto rounded-2xl border focus-visible:outline-2"
    >
      <table className="w-full min-w-[480px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface text-muted text-xs font-bold tracking-wide">
          <tr>
            <th scope="col" className="px-4 py-3">
              {t("KAWASAN")}
            </th>
            <th scope="col" className="px-4 py-3">
              {t("IPU")}
            </th>
            <th scope="col" className="px-4 py-3">
              {t("STATUS")}
            </th>
            <th scope="col" className="px-4 py-3">
              {t("PENCEMAR")}
            </th>
            <th scope="col" className="px-4 py-3">
              {t("MASA")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-line divide-y">
          {sorted.map((s) => (
            <tr key={s.id}>
              <th scope="row" className="px-4 py-3 font-semibold">
                {s.name}
              </th>
              <td className="font-display px-4 py-3 text-xl font-bold">
                {s.ipu ?? "–"}
              </td>
              <td className="px-4 py-3">
                {s.ipu === null ? (
                  <span className="text-muted">{t("Tiada bacaan")}</span>
                ) : (
                  <IpuPill
                    category={ipuCategory(s.ipu).key}
                    label={t(ipuCategory(s.ipu).label)}
                    className="!text-xs"
                  />
                )}
              </td>
              <td className="text-muted px-4 py-3">{s.pollutant ?? "–"}</td>
              <td className="text-muted px-4 py-3">
                {s.time ? formatClock(s.time, lang) : "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
