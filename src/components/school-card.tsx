"use client";

import { Backpack, CaretRight, X } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PrimaryReading } from "@/lib/official";
import {
  SCHOOL_PROLONGED_DAYS,
  schoolStatus,
  schoolTomorrow,
  type SchoolLevel,
} from "@/lib/school";
import { useI18n } from "@/lib/use-i18n";
import { useMediaQuery } from "@/lib/use-media-query";

const LEVEL_CLASS: Record<SchoolLevel, string> = {
  normal: "bg-ipu-sederhana-tint text-ipu-sederhana-ink",
  "no-outdoor": "bg-ipu-tidak-sihat-tint text-ipu-tidak-sihat-ink",
  closed: "bg-ipu-berbahaya-tint text-ipu-berbahaya-ink",
};

const ICON_CLASS: Record<SchoolLevel, string> = {
  normal: "bg-ipu-sederhana",
  "no-outdoor": "bg-ipu-tidak-sihat",
  closed: "bg-ipu-berbahaya",
};

/**
 * Kad padat status sekolah (KPM) berdasarkan IPU utama, dengan jangkaan sekolah ditutup
 * esok daripada bacaan jam 2 petang. Ketik → helaian dengan garis panduan penuh.
 */
export function SchoolCard({
  reading,
  twoPm,
}: {
  reading: PrimaryReading;
  /** IPU jam 2 petang stesen (lama → hari ini). */
  twoPm?: readonly (number | null)[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const status = schoolStatus(reading.ipu);
  const tomorrow = twoPm ? schoolTomorrow(twoPm) : null;
  const level: SchoolLevel =
    tomorrow?.level === "likely" ? "closed" : status.level;
  const title =
    tomorrow?.level === "likely"
      ? t("Sekolah mungkin ditutup esok")
      : t(status.title);
  const summary = tomorrow
    ? tomorrow.level === "likely"
      ? t("IPU jam 2 petang {ipu} · Tunggu pengumuman JPN/PPD", {
          ipu: tomorrow.ipu,
        })
      : t("IPU jam 2 petang melebihi 150 (hari {n} daripada {total})", {
          n: tomorrow.streak,
          total: SCHOOL_PROLONGED_DAYS,
        })
    : t(status.summary);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        data-testid="school-card"
        data-level={level}
        className={`flex w-full items-center gap-3 rounded-[20px] px-3.5 py-3 text-left ${LEVEL_CLASS[level]}`}
      >
        <span
          aria-hidden="true"
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ${ICON_CLASS[level]}`}
        >
          <Backpack size={22} weight="fill" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] leading-tight font-bold">
            {title}
          </span>
          <span className="mt-0.5 block text-[13px] leading-snug font-medium">
            {summary}
          </span>
        </span>
        <CaretRight aria-hidden="true" size={18} weight="bold" />
      </button>
      {open &&
        createPortal(
          <SchoolSheet
            reading={reading}
            tomorrowLine={tomorrow ? summary : null}
            title={title}
            onClose={() => setOpen(false)}
          />,
          document.body,
        )}
    </>
  );
}

function SchoolSheet({
  reading,
  title,
  tomorrowLine,
  onClose,
}: {
  reading: PrimaryReading;
  title: string;
  tomorrowLine: string | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const wide = useMediaQuery("(min-width: 768px)");
  const titleId = useId();
  const close = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const status = schoolStatus(reading.ipu);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="sheet-backdrop fixed inset-0 z-50 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="school-sheet"
        className={`bg-page text-ink fixed z-50 flex flex-col gap-3 p-5 ${
          wide
            ? "top-1/2 left-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] shadow-[0_16px_48px_rgb(0_0_0/0.25)]"
            : "sheet-up inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-[28px] pb-[max(env(safe-area-inset-bottom),20px)]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-muted text-xs font-bold tracking-wide">
              {t("STATUS SEKOLAH")}
            </p>
            <h2 id={titleId} className="font-display text-xl font-bold">
              {title}
            </h2>
          </div>
          <button
            ref={close}
            type="button"
            onClick={onClose}
            aria-label={t("Tutup")}
            className="bg-surface hover:bg-line flex size-9 shrink-0 items-center justify-center rounded-full"
          >
            <X aria-hidden="true" size={16} weight="bold" />
          </button>
        </div>
        {tomorrowLine && (
          <p className="text-sm leading-relaxed font-semibold">
            {tomorrowLine}.{" "}
            {t(
              "Garis panduan KPM: sekolah ditutup bila IPU melebihi 180, atau melebihi 150 tiga hari berturut-turut. Keputusan harian berdasarkan bacaan jam 2 petang.",
            )}
          </p>
        )}
        <p className="text-sm leading-relaxed">{t(status.detail)}</p>
        <p className="text-muted text-xs font-semibold">
          {t(
            reading.source === "apims"
              ? "Panduan sahaja (IPU rasmi {ipu}). Keputusan rasmi dibuat oleh sekolah, PPD dan JPN."
              : "Panduan sahaja (anggaran IPU {ipu}). Keputusan rasmi dibuat oleh sekolah, PPD dan JPN.",
            { ipu: reading.ipu },
          )}
        </p>
      </div>
    </>
  );
}
