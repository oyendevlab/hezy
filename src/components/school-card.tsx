"use client";

import {
  Backpack,
  CheckCircle,
  Info,
  Megaphone,
  Prohibit,
  TrendUp,
  Warning,
} from "@phosphor-icons/react";
import { useState } from "react";
import { formatHour } from "@/lib/format";
import type { PrimaryReading } from "@/lib/official";
import {
  schoolPersistentHigh,
  schoolStatus,
  type SchoolLevel,
} from "@/lib/school";
import { useI18n } from "@/lib/use-i18n";
import { BottomSheet } from "./bottom-sheet";

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

const LEVEL_ICON = {
  normal: CheckCircle,
  "no-outdoor": Backpack,
  closed: Warning,
} as const;

/**
 * Kad padat status sekolah (v0.7.3): tajuk ringkas ikut IPU utama dan peringatan untuk
 * menyemak keputusan rasmi; tiada ambang, ramalan penutupan atau arahan operasi sekolah.
 * Ketik → helaian dengan butiran berikon.
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
  const persistent = twoPm ? schoolPersistentHigh(twoPm) !== null : false;
  const Icon = LEVEL_ICON[status.level];
  const summary = persistent
    ? t("Bacaan tinggi berterusan · Pantau pengumuman sekolah")
    : t("Semak keputusan rasmi sekolah");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        data-testid="school-card"
        data-level={status.level}
        data-persistent={persistent ? "true" : undefined}
        className={`flex w-full items-center gap-3 rounded-[20px] px-3.5 py-3 text-left ${LEVEL_CLASS[status.level]}`}
      >
        <span
          aria-hidden="true"
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ${ICON_CLASS[status.level]}`}
        >
          <Icon size={22} weight="fill" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] leading-tight font-bold">
            {t(status.title)}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[13px] leading-snug font-medium">
            {persistent ? (
              <TrendUp aria-hidden="true" size={14} weight="bold" />
            ) : (
              <Megaphone aria-hidden="true" size={14} weight="bold" />
            )}
            {summary}
          </span>
        </span>
        <Info aria-hidden="true" size={20} weight="bold" />
        <span className="sr-only">{t("— butiran status sekolah")}</span>
      </button>
      {open && (
        <SchoolSheet
          reading={reading}
          persistent={persistent}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function SchoolSheet({
  reading,
  persistent,
  onClose,
}: {
  reading: PrimaryReading;
  persistent: boolean;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const status = schoolStatus(reading.ipu);
  const rows: { icon: typeof Info; text: string }[] = [
    status.level === "normal"
      ? { icon: CheckCircle, text: t("Aktiviti luar dibenarkan") }
      : {
          icon: Prohibit,
          text: t("Tiada perhimpunan, sukan atau kokurikulum di luar"),
        },
    ...(status.level === "closed"
      ? [{ icon: Warning, text: t("IPU sangat tinggi: semak pengumuman PdPR") }]
      : []),
    ...(persistent
      ? [
          {
            icon: TrendUp,
            text: t("Bacaan tinggi berterusan: pantau pengumuman untuk esok"),
          },
        ]
      : []),
    { icon: Megaphone, text: t("Keputusan rasmi oleh sekolah, PPD dan JPN") },
  ];
  return (
    <BottomSheet
      title={t(status.title)}
      eyebrow={t("STATUS SEKOLAH")}
      onClose={onClose}
      testId="school-sheet"
    >
      <ul className="flex flex-col gap-2.5">
        {rows.map(({ icon: RowIcon, text }) => (
          <li
            key={text}
            className="flex items-start gap-3 text-sm leading-snug"
          >
            <RowIcon
              aria-hidden="true"
              size={20}
              weight="duotone"
              className="mt-px shrink-0"
            />
            {text}
          </li>
        ))}
      </ul>
      <p className="text-muted border-line border-t pt-3 text-xs font-semibold">
        {t(
          reading.source === "apims"
            ? "Berdasarkan IPU rasmi {ipu} · {time}"
            : "Berdasarkan anggaran IPU {ipu} · {time}",
          { ipu: reading.ipu, time: formatHour(reading.time, lang) },
        )}
      </p>
    </BottomSheet>
  );
}
