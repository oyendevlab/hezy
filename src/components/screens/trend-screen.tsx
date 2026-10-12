"use client";

import { CaretDown, MapPin } from "@phosphor-icons/react";
import Link from "next/link";
import { primaryReading } from "@/lib/official";
import { useI18n } from "@/lib/use-i18n";
import { useMediaQuery } from "@/lib/use-media-query";
import { CompareLocations } from "../compare-locations";
import { HistoryHeatmap } from "../history-heatmap";
import { SchoolCard } from "../school-card";
import { ChooseLocation } from "../choose-location";
import { PullToRefresh } from "../pull-to-refresh";
import { ReadingNotices } from "../reading-notices";
import { RefreshButton } from "../refresh-button";
import { Notice, Skeleton } from "../status";
import { TrendPanel } from "../trend-panel";
import { useCurrent } from "../use-current";

export function TrendScreen() {
  const { t } = useI18n();
  const wide = useMediaQuery("(min-width: 1024px)");
  const { prefs, location, entry, refresh } = useCurrent();
  const reading = entry?.reading;
  const current = primaryReading(reading);

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-5 pt-13 md:pt-10">
      <PullToRefresh />
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col items-start gap-2">
          <h1 className="font-display text-[30px] leading-none font-bold">
            {t("Trend")}
          </h1>
          {location && (
            <Link
              href="/lokasi"
              className="bg-surface hover:bg-line inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full py-1.5 pr-2.5 pl-2 text-sm font-semibold transition-colors"
            >
              <MapPin aria-hidden="true" size={16} weight="fill" />
              <span className="truncate">{t(location.name)}</span>
              <CaretDown aria-hidden="true" size={14} weight="bold" />
              <span className="sr-only">{t("— tukar lokasi")}</span>
            </Link>
          )}
        </div>
        <RefreshButton className="hidden md:inline-flex" />
      </div>

      {prefs === null && <Skeleton className="h-[420px]" />}
      {prefs && !location && <ChooseLocation />}
      {entry && <ReadingNotices entry={entry} onRetry={refresh} />}
      {location && !reading && entry?.status === "error" && (
        <Notice action={{ label: t("Cuba lagi"), onClick: refresh }}>
          {t(entry.error ?? "")}
        </Notice>
      )}
      {location && !reading && entry?.status !== "error" && (
        <Skeleton className="h-[420px]" />
      )}
      {current && prefs && (prefs.profile === "anak" || prefs.showSchool) && (
        <SchoolCard reading={current} />
      )}
      {reading && <TrendPanel reading={reading} />}
      {reading?.official && (
        <HistoryHeatmap
          stationId={reading.official.stationId}
          stationName={reading.official.stationName}
        />
      )}
      {wide && prefs?.current && <CompareLocations prefs={prefs} />}
    </div>
  );
}
