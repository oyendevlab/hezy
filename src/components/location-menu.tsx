"use client";

import {
  CaretDown,
  Check,
  Crosshair,
  MapPin,
  Plus,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { GEO_ERROR_MESSAGE, requestPosition } from "@/lib/geolocation";
import { gpsToLocation, samePlace } from "@/lib/locations";
import { primaryReading } from "@/lib/official";
import { updatePrefs, usePrefs, type SavedLocation } from "@/lib/prefs";
import { useI18n } from "@/lib/use-i18n";
import { useMediaQuery } from "@/lib/use-media-query";
import { useReading } from "@/lib/use-reading";
import { IpuPill } from "./ipu-pill";

/**
 * Cip lokasi yang membuka menu tukar lokasi pantas: lokasi semasa, kegemaran (dengan IPU),
 * GPS dan pautan tambah bandar. Telefon: helaian bawah; desktop: menu jatuh.
 */
export function LocationMenu({
  location,
  className = "",
}: {
  location: SavedLocation;
  /** Gaya cip (latar & bayang); bentuk asas ditetapkan di sini. */
  className?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const prefs = usePrefs();
  const wide = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const favourites = (prefs?.favourites ?? []).filter(
    (f) => !samePlace(f, location),
  );

  const close = (restoreFocus = true) => {
    setOpen(false);
    setError(null);
    if (restoreFocus) button.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("button, a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      // Fokus kekal dalam menu (Tab berpusing).
      if (e.key !== "Tab" || !panel.current) return;
      const items = [
        ...panel.current.querySelectorAll<HTMLElement>("button, a"),
      ];
      const first = items[0];
      const last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target))
        close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const choose = (next: SavedLocation) => {
    updatePrefs((p) => ({ ...p, current: next }));
    close();
  };

  async function useGps() {
    setBusy(true);
    setError(null);
    const result = await requestPosition();
    setBusy(false);
    if (!result.ok) {
      setError(t(GEO_ERROR_MESSAGE[result.reason]));
      return;
    }
    choose(gpsToLocation(result.lat, result.lon));
  }

  const row =
    "hover:bg-surface focus-visible:bg-surface flex min-h-13 w-full items-center gap-3 rounded-2xl px-3 text-left text-[15px]";

  const content = (
    <>
      <h2 id={titleId} className="text-muted px-3 pt-1 pb-2 text-xs font-bold">
        {t("TUKAR LOKASI")}
      </h2>
      <ul className="flex flex-col">
        <li>
          <button
            type="button"
            aria-current="true"
            onClick={() => close()}
            className={`${row} font-bold`}
          >
            <MapPin aria-hidden="true" size={20} weight="fill" />
            <span className="min-w-0 flex-1 truncate">{t(location.name)}</span>
            <Check aria-hidden="true" size={18} weight="bold" />
            <span className="sr-only">{t("(semasa)")}</span>
          </button>
        </li>
        {favourites.map((f) => (
          <li key={f.id}>
            <FavouriteRow
              location={f}
              className={row}
              onChoose={() => choose(f)}
            />
          </li>
        ))}
      </ul>
      {prefs && favourites.length === 0 && (
        <p className="text-muted px-3 py-2 text-sm">
          {t("Tiada lokasi kegemaran lagi.")}
        </p>
      )}
      <div className="border-line mt-1 flex flex-col border-t pt-1">
        <button
          type="button"
          onClick={useGps}
          disabled={busy}
          className={`${row} font-semibold disabled:opacity-60`}
        >
          <Crosshair aria-hidden="true" size={20} weight="duotone" />
          {busy ? t("Mengesan lokasi…") : t("Guna lokasi saya")}
        </button>
        {error && (
          <p role="alert" className="text-muted px-3 pb-2 text-sm">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            close(false);
            router.push("/lokasi#tambah");
          }}
          className={`${row} font-semibold`}
        >
          <Plus aria-hidden="true" size={20} weight="bold" />
          {t("Tambah bandar")}
        </button>
      </div>
    </>
  );

  return (
    <div className="relative min-w-0">
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        data-testid="location-menu-button"
        className={`flex min-h-11 max-w-full items-center gap-1.5 rounded-full px-3.5 text-base font-semibold ${className}`}
      >
        <MapPin
          aria-hidden="true"
          size={17}
          weight="bold"
          className="shrink-0"
        />
        <span className="truncate">{t(location.name)}</span>
        <span className="sr-only">{t("— tukar lokasi")}</span>
        <CaretDown
          aria-hidden="true"
          size={15}
          weight="bold"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open &&
        (wide ? (
          <div
            ref={panel}
            role="dialog"
            aria-labelledby={titleId}
            data-testid="location-menu"
            className="bg-page text-ink absolute top-full left-0 z-50 mt-2 w-[300px] rounded-[20px] p-2 shadow-[0_8px_32px_rgb(0_0_0/0.18)]"
          >
            {content}
          </div>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="sheet-backdrop fixed inset-0 z-50 bg-black/35"
            />
            <div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-testid="location-menu"
              className="bg-page text-ink sheet-up fixed inset-x-0 bottom-0 z-50 max-h-[80svh] overflow-y-auto overscroll-contain rounded-t-[28px] px-3 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]"
            >
              <div
                aria-hidden="true"
                className="bg-line mx-auto mb-3 h-1.5 w-10 rounded-full"
              />
              {content}
            </div>
          </>
        ))}
    </div>
  );
}

function FavouriteRow({
  location,
  className,
  onChoose,
}: {
  location: SavedLocation;
  className: string;
  onChoose: () => void;
}) {
  const { t } = useI18n();
  const { entry } = useReading(location);
  const current = primaryReading(entry?.reading);
  return (
    <button type="button" onClick={onChoose} className={className}>
      <MapPin aria-hidden="true" size={20} weight="duotone" />
      <span className="min-w-0 flex-1 truncate font-semibold">
        {t(location.name)}
      </span>
      {current && (
        <IpuPill
          category={current.category}
          label={
            <>
              {current.ipu}
              <span className="sr-only"> {t(current.label)}</span>
            </>
          }
          className="!px-2.5 !text-xs tabular-nums"
        />
      )}
    </button>
  );
}
