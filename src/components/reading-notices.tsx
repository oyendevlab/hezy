"use client";

import { formatClock } from "@/lib/format";
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
  const reading = entry.reading;
  if (!reading) return null;
  return (
    <>
      {entry.status === "error" && (
        <Notice action={{ label: "Cuba lagi", onClick: onRetry }}>
          {entry.error} Memaparkan bacaan
          {reading.current
            ? ` ${formatClock(reading.current.time)}`
            : " terakhir"}
          .
        </Notice>
      )}
      {entry.status !== "error" && reading.stale && (
        <Notice tone="warning">Data mungkin tidak terkini.</Notice>
      )}
    </>
  );
}
