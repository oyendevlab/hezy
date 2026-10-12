"use client";

import Link from "next/link";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { ipuCategory } from "@/lib/ipu";
import { displayIpu } from "@/lib/official";
import type { HourPoint } from "@/lib/reading";
import { useI18n } from "@/lib/use-i18n";
import { Chevron } from "./chevron";

const SCALE_MAX = 200;

/** Kad butang ke Trend dengan graf mini 24 jam (jam lepas penuh, ramalan pudar). */
export function TrendLink({ hours }: { hours: HourPoint[] }) {
  const { t } = useI18n();
  return (
    <Link
      href="/trend"
      className="bg-surface hover:bg-line flex flex-col gap-3 rounded-[22px] p-4 transition-colors"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-bold">
          {t("Lihat trend jam demi jam")}
        </span>
        <Chevron />
      </span>
      {hours.length > 0 && (
        <span aria-hidden="true" className="flex h-10 items-end gap-[2px]">
          {hours.map((h) => {
            const v = displayIpu(h);
            return (
              <span
                key={h.time}
                className={`flex-1 rounded-[2px] ${h.forecast ? "opacity-45" : ""}`}
                style={{
                  height:
                    v === null
                      ? 3
                      : Math.max(
                          3,
                          Math.round((Math.min(v, SCALE_MAX) / SCALE_MAX) * 40),
                        ),
                  background:
                    v === null
                      ? "var(--line)"
                      : CATEGORY_STYLE[ipuCategory(v).key].accent,
                }}
              />
            );
          })}
        </span>
      )}
    </Link>
  );
}

/** Ketinggian bar rangka (tetap, supaya tiada ketidakpadanan hidrasi). */
const SKELETON_BARS = [
  10, 12, 14, 13, 11, 10, 12, 16, 20, 24, 28, 30, 31, 32, 30, 28, 26, 24, 20,
  16, 14, 12, 13, 14,
];

export function TrendLinkSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="trend-link-skeleton"
      className="bg-surface flex flex-col gap-3 rounded-[22px] p-4"
    >
      <span className="bg-line h-4 w-40 animate-pulse rounded-md motion-reduce:animate-none" />
      <span className="flex h-10 items-end gap-[2px]">
        {SKELETON_BARS.map((h, i) => (
          <span
            key={i}
            className="bg-line flex-1 animate-pulse rounded-[2px] motion-reduce:animate-none"
            style={{ height: h }}
          />
        ))}
      </span>
    </div>
  );
}
