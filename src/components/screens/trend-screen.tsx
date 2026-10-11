"use client";

import Link from "next/link";
import { ChooseLocation } from "../choose-location";
import { IpuPill } from "../ipu-pill";
import { ReadingNotices } from "../reading-notices";
import { Notice, Skeleton } from "../status";
import { TrendPanel } from "../trend-panel";
import { useCurrent } from "../use-current";

export function TrendScreen() {
  const { prefs, location, entry, refresh } = useCurrent();
  const reading = entry?.reading;
  const current = reading?.current;

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-5 pt-13 md:pt-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[30px] font-bold">Trend</h1>
          {location && (
            <Link
              href="/lokasi"
              className="text-muted text-sm font-semibold underline"
            >
              {location.name}
            </Link>
          )}
        </div>
        {current && (
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold">
              {current.ipu}
            </span>
            <IpuPill category={current.category} label={current.label} />
          </div>
        )}
      </div>

      {prefs === null && <Skeleton className="h-[420px]" />}
      {prefs && !location && <ChooseLocation />}
      {entry && <ReadingNotices entry={entry} onRetry={refresh} />}
      {location && !reading && entry?.status === "error" && (
        <Notice action={{ label: "Cuba lagi", onClick: refresh }}>
          {entry.error}
        </Notice>
      )}
      {location && !reading && entry?.status !== "error" && (
        <Skeleton className="h-[420px]" />
      )}
      {reading && <TrendPanel reading={reading} />}
    </div>
  );
}
