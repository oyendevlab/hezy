"use client";

import { Info, type Icon } from "@phosphor-icons/react";
import { useState } from "react";
import { useI18n } from "@/lib/use-i18n";
import { BottomSheet } from "./bottom-sheet";

export type InfoRow = { icon: Icon; text: string };

/**
 * Butang ⓘ kecil di sebelah tajuk bahagian (v0.7.5): membuka helaian dengan penerangan
 * ringkas berikon, menggantikan teks penerangan panjang di bawah bahagian.
 */
export function InfoSheetButton({
  title,
  label,
  rows,
  testId,
}: {
  /** Tajuk helaian. */
  title: string;
  /** Label boleh dibaca skrin bagi butang, cth. "Tentang ramalan harian". */
  label: string;
  rows: InfoRow[];
  testId?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={label}
        className="text-muted hover:bg-surface -my-2 inline-flex size-9 shrink-0 items-center justify-center rounded-full align-middle"
      >
        <Info aria-hidden="true" size={18} weight="bold" />
      </button>
      {open && (
        <BottomSheet
          title={title}
          onClose={() => setOpen(false)}
          testId={testId}
        >
          <ul className="flex flex-col gap-3">
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
                {t(text)}
              </li>
            ))}
          </ul>
        </BottomSheet>
      )}
    </>
  );
}
