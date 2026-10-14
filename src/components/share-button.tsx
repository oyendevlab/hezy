"use client";

import { useEffect, useState } from "react";
import type { CardFormat } from "@/lib/share-card";
import { useI18n } from "@/lib/use-i18n";
import { BottomSheet } from "./bottom-sheet";

type Files = Partial<Record<CardFormat, File>>;

/**
 * Kongsi status. Dengan `card`, butang membuka helaian dengan pratonton kad bergambar
 * (segi empat untuk chat, 9:16 untuk Status) yang dikongsi sebagai fail melalui Web Share;
 * pelayar tanpa sokongan kongsi fail memuat turun imej. `path` = halaman kongsi (pautan).
 */
export function ShareButton({
  text,
  path = "/",
  card,
  fileName = "hezy",
  label,
  title,
  className = "",
}: {
  text: string;
  path?: string;
  /** Laluan imej kad bagi setiap format. */
  card?: (format: CardFormat) => string;
  fileName?: string;
  /** Teks butang yang kelihatan (cth. "Gambar"); tanpanya butang ikon bulat. */
  label?: string;
  /** Tajuk helaian; lalai "Kongsi IPU terkini". */
  title?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<Files>({});
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cardPaths = card
    ? { square: card("square"), story: card("story") }
    : null;
  const squarePath = cardPaths?.square;
  const storyPath = cardPaths?.story;

  const url = () => new URL(path, window.location.origin).href;
  const shareText = () => `${text} ${url()}`;

  // Muat imej awal semasa helaian dibuka, supaya navigator.share dipanggil terus dalam ketikan.
  useEffect(() => {
    if (!open || !squarePath || !storyPath) return;
    let cancelled = false;
    {
      for (const [format, src] of [
        ["square", squarePath],
        ["story", storyPath],
      ] as const) {
        fetch(src)
          .then((res) => (res.ok ? res.blob() : Promise.reject()))
          .then((blob) => {
            if (cancelled) return;
            const file = new File([blob], `${fileName}-${format}.png`, {
              type: "image/png",
            });
            setFiles((f) => ({ ...f, [format]: file }));
          })
          .catch(() => undefined);
      }
    }
    return () => {
      cancelled = true;
    };
  }, [open, squarePath, storyPath, fileName]);

  function openSheet() {
    setMessage(null);
    if (!cardPaths) {
      void shareLink();
      return;
    }
    setFiles({});
    setOpen(true);
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Hezy", text, url: url() });
      } catch {
        // Pengguna membatalkan perkongsian.
      }
      return;
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareText());
      setCopied(true);
      setMessage(t("Pautan disalin"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage(t("Pautan tidak dapat disalin."));
    }
  }

  async function shareImage(format: CardFormat) {
    const file = files[format];
    if (!file) return;
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: shareText() });
      } catch {
        // Pengguna membatalkan perkongsian.
      }
      return;
    }
    // Sandaran: muat turun imej dan salin pautan.
    const href = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = href;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    try {
      await navigator.clipboard.writeText(shareText());
    } catch {
      // Abaikan.
    }
    setMessage(t("Imej dimuat turun dan pautan disalin."));
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-haspopup={cardPaths ? "dialog" : undefined}
        aria-label={
          label ? undefined : copied ? t("Status disalin") : t("Kongsi status")
        }
        className={
          label
            ? `flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ${className}`
            : `flex size-11 items-center justify-center rounded-full ${className}`
        }
      >
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
        {label}
      </button>

      {cardPaths && open && (
        <BottomSheet
          title={title ?? t("Kongsi IPU terkini")}
          onClose={() => setOpen(false)}
          testId="share-sheet"
        >
          <div className="bg-surface aspect-square overflow-hidden rounded-2xl">
            {/* Imej dijana pelayan (next/og); next/image tidak diperlukan. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardPaths.square}
              alt={t("Pratonton kad: {text}", { text })}
              width={1080}
              height={1080}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void shareImage("square")}
              disabled={!files.square}
              className="bg-ink text-page min-h-12 rounded-2xl px-3 text-sm font-semibold disabled:opacity-50"
            >
              {t("Kongsi gambar")}
            </button>
            <button
              type="button"
              onClick={() => void shareImage("story")}
              disabled={!files.story}
              className="bg-ink text-page min-h-12 rounded-2xl px-3 text-sm font-semibold disabled:opacity-50"
            >
              {t("Untuk Status (9:16)")}
            </button>
          </div>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="border-line min-h-12 rounded-2xl border-[1.5px] text-sm font-semibold"
          >
            {t("Salin pautan")}
          </button>
          <p role="status" className="text-muted min-h-5 text-center text-xs">
            {message ??
              (!files.square || !files.story ? t("Menyediakan imej…") : "")}
          </p>
        </BottomSheet>
      )}
    </>
  );
}
