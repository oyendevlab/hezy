"use client";

import { useI18n } from "@/lib/use-i18n";

/** Langkah pasang di iPhone/iPad: Apple tidak membenarkan butang pasang dalam laman web. */
export const IOS_STEPS = [
  "Ketik butang Kongsi di bar Safari (di iOS 26, ketik ⋯ dahulu, kemudian Kongsi).",
  "Tatal ke bawah dan pilih “Tambah ke Skrin Utama”.",
  "Pastikan “Buka sebagai Apl Web” dihidupkan, kemudian ketik Tambah.",
  "Buka Hezy dari ikon di skrin utama.",
];

export function IosInstallSteps({ id }: { id: string }) {
  const { t } = useI18n();
  return (
    <ol id={id} className="mt-2 flex flex-col gap-2.5 pb-1 text-sm">
      {IOS_STEPS.map((step, i) => (
        <li key={step} className="flex gap-3">
          <span className="bg-ink text-page flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {i + 1}
          </span>
          <span className="leading-snug">{t(step)}</span>
        </li>
      ))}
    </ol>
  );
}
