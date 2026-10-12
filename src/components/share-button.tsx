"use client";

import { useState } from "react";
import { useI18n } from "@/lib/use-i18n";

/** Kongsi status melalui Web Share, atau salin ke papan keratan. `path` = halaman kongsi (kad bergambar). */
export function ShareButton({
  text,
  path = "/",
  className = "",
}: {
  text: string;
  path?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Hezy", text, url });
      } catch {
        // Pengguna membatalkan perkongsian.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Papan keratan tidak tersedia.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? t("Status disalin") : t("Kongsi status")}
      className={`flex size-11 items-center justify-center rounded-full ${className}`}
    >
      {copied ? (
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="5 12 10 17 19 7" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      )}
    </button>
  );
}
