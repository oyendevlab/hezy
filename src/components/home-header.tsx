"use client";

import { useEffect, useState } from "react";
import type { PrimaryReading } from "@/lib/official";
import { useI18n } from "@/lib/use-i18n";
import { AnimatedNumber } from "./animated-number";
import { IpuPill } from "./ipu-pill";

/** Tinggi kira-kira pengepala: nombor di bawahnya dianggap tersorok. */
const HEADER_PX = 80;

/**
 * Pengepala Utama yang kekal di atas semasa menatal (cip terapung, tanpa jalur latar),
 * dan IPU ringkas dalam pil bila nombor besar (`[data-ipu-headline]`) keluar dari skrin.
 */
export function HomeHeader({
  left,
  right,
  current,
  className = "",
  innerClassName = "",
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  current: PrimaryReading | null;
  className?: string;
  innerClassName?: string;
}) {
  const { t } = useI18n();
  const [compact, setCompact] = useState(false);

  // Semasa menatal: IPU ringkas bila nombor besar yang
  // kelihatan (bukan versi telefon/desktop yang tersembunyi) sudah di bawah pengepala.
  const ipu = current?.ipu ?? null;
  useEffect(() => {
    const onScroll = () => {
      const shown = [
        ...document.querySelectorAll("[data-ipu-headline]"),
      ].filter((el) => el.getBoundingClientRect().height > 0);
      setCompact(
        shown.length > 0 &&
          shown.every((el) => el.getBoundingClientRect().bottom < HEADER_PX),
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ipu]);

  return (
    <header
      data-testid="home-header"
      data-compact={compact ? "true" : "false"}
      className={`sticky top-0 z-20 ${className}`}
    >
      <div
        className={`relative flex items-center justify-between gap-3 ${innerClassName}`}
      >
        <div className="min-w-0">{left}</div>
        <div className="relative flex shrink-0 items-center gap-2">
          {current && (
            <div
              aria-hidden="true"
              className={`flex items-center gap-1.5 rounded-full bg-white/70 py-1 pr-1.5 pl-3 text-[#1c1a16] shadow-[0_1px_6px_rgb(0_0_0/0.12)] backdrop-blur transition-all duration-200 motion-reduce:transition-none ${
                compact
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none absolute right-full mr-2 translate-y-1 opacity-0"
              }`}
            >
              <span className="font-display text-xl leading-none font-bold tabular-nums">
                <AnimatedNumber value={current.ipu} />
              </span>
              <IpuPill
                category={current.category}
                label={t(current.label)}
                className="!px-2 !py-0.5 !text-[11px]"
              />
            </div>
          )}
          {right}
        </div>
      </div>
    </header>
  );
}
