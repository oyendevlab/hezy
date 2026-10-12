"use client";

import Link from "next/link";
import { primaryReading } from "@/lib/official";
import { useI18n } from "@/lib/use-i18n";
import { useMediaQuery } from "@/lib/use-media-query";
import { CompareLocations } from "../compare-locations";
import { SchoolCard } from "../school-card";
import { ChooseLocation } from "../choose-location";
import { IpuPill } from "../ipu-pill";
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[30px] font-bold">{t("Trend")}</h1>
          {location && (
            <Link
              href="/lokasi"
              className="text-muted text-sm font-semibold underline"
            >
              {t(location.name)}
            </Link>
          )}
        </div>
        {current && (
          <div className="flex items-center gap-2">
            <RefreshButton className="mr-1 hidden md:inline-flex" />
            <span className="font-display text-2xl font-bold">
              {current.ipu}
            </span>
            <IpuPill category={current.category} label={t(current.label)} />
          </div>
        )}
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
      {wide && prefs?.current && <CompareLocations prefs={prefs} />}
    </div>
  );
}
