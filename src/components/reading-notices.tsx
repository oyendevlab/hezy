"use client";

import { formatClock } from "@/lib/format";
import { useI18n } from "@/lib/use-i18n";
import type { ReadingEntry } from "@/lib/use-reading";
import { Notice } from "./status";

/** Notis bila kemas kini gagal tetapi ada bacaan lama, atau data lapuk. */
export function ReadingNotices({
  entry,
  onRetry,
}: {
  entry: ReadingEntry;
  onRetry: () => void;
}) {
  const { t, lang } = useI18n();
  const reading = entry.reading;
  if (!reading) return null;
  const error = t(entry.error ?? "");
  return (
    <>
      {entry.status === "error" && (
        <Notice action={{ label: t("Cuba lagi"), onClick: onRetry }}>
          {reading.current
            ? t("{error} Memaparkan bacaan {time}.", {
                error,
                time: formatClock(reading.current.time, lang),
              })
            : t("{error} Memaparkan bacaan terakhir.", { error })}
        </Notice>
      )}
      {entry.status !== "error" && reading.stale && (
        <Notice tone="warning">{t("Data mungkin tidak terkini.")}</Notice>
      )}
    </>
  );
}
