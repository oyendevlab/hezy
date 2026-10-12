"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-errors";
import { useI18n } from "@/lib/use-i18n";

/** Sempadan ralat halaman: laporkan ralat render dan beri pilihan cuba lagi. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    reportError("render", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-5 pt-16">
      <h1 className="font-display text-[28px] font-bold">
        {t("Maaf, ada ralat")}
      </h1>
      <p className="text-muted">
        {t(
          "Ralat ini telah dilaporkan secara automatik. Cuba muat semula halaman.",
        )}
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-ink text-page min-h-12 self-start rounded-2xl px-5 font-semibold"
      >
        {t("Cuba lagi")}
      </button>
    </div>
  );
}
