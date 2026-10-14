"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { areaToLocation, samePlace } from "@/lib/locations";
import { primaryReading } from "@/lib/official";
import {
  MAX_FAVOURITES,
  addFavourite,
  removeFavourite,
  toggleAlertFavourite,
  updatePrefs,
  usePrefs,
  type SavedLocation,
} from "@/lib/prefs";
import { pushSupport } from "@/lib/push-client";
import { useI18n } from "@/lib/use-i18n";
import { useReading } from "@/lib/use-reading";
import { ChooseLocation } from "../choose-location";
import { Chevron } from "../chevron";
import { IpuPill } from "../ipu-pill";
import { LocationSearch } from "../location-search";
import { PullToRefresh } from "../pull-to-refresh";
import { RefreshButton } from "../refresh-button";
import { SKY_CARD, SkyHeader } from "../sky-header";
import { Skeleton } from "../status";
import { FavouriteList } from "../favourite-list";

// Leaflet hanya dimuatkan bila tab Peta dibuka.
const StationMap = dynamic(
  () => import("../station-map").then((m) => m.StationMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] md:h-[520px]" />,
  },
);

const noopSubscribe = () => () => {};

const subscribeHash = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};

export function LokasiScreen() {
  const { t } = useI18n();
  const prefs = usePrefs();
  const canAlert = useSyncExternalStore(
    noopSubscribe,
    () => pushSupport() === "supported",
    () => false,
  );
  const router = useRouter();
  // Peta dipaparkan dahulu; `#senarai` membuka tab Senarai, `#tambah` membuka carian kegemaran.
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => "",
  );
  const [chosenView, setView] = useState<"list" | "map" | null>(null);
  const view =
    chosenView ?? (hash === "#senarai" || hash === "#tambah" ? "list" : "map");
  const [changing, setChanging] = useState(false);
  const [chosenAdding, setAdding] = useState<boolean | null>(null);
  const adding = chosenAdding ?? hash === "#tambah";

  const select = (location: SavedLocation) => {
    updatePrefs((p) => ({ ...p, current: location }));
    router.push("/");
  };

  return (
    <>
      <SkyHeader title={t("Lokasi")} />
      <div
        className={`mx-auto flex max-w-[960px] flex-col gap-5 px-5 md:px-10 md:pt-10 ${SKY_CARD}`}
      >
        <PullToRefresh />
        <div className="hidden items-center justify-between gap-3 md:flex">
          <h1 className="font-display text-[30px] font-bold">{t("Lokasi")}</h1>
          <RefreshButton className="hidden md:inline-flex" />
        </div>

        <div
          role="tablist"
          aria-label={t("Paparan lokasi")}
          className="bg-surface grid grid-cols-2 gap-1 rounded-2xl p-1"
        >
          {(["map", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`min-h-10 rounded-xl text-sm ${view === v ? "bg-page font-bold" : "text-muted font-medium"}`}
            >
              {v === "list" ? t("Senarai") : t("Peta")}
            </button>
          ))}
        </div>

        {view === "map" && <StationMap />}

        <Link
          href="/negeri"
          transitionTypes={["nav-forward"]}
          className="bg-surface hover:bg-line flex min-h-16 items-center gap-3 rounded-[18px] py-3 pr-3 pl-3.5 transition-colors"
        >
          <span className="bg-page flex size-10 shrink-0 items-center justify-center rounded-full">
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
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold">
              {t("IPU mengikut negeri")}
            </span>
            <span className="text-muted block text-xs">
              {t("Semua stesen APIMS di 13 negeri dan 3 wilayah")}
            </span>
          </span>
          <Chevron />
        </Link>

        {view === "list" && prefs === null && <Skeleton className="h-64" />}

        {view === "list" && prefs && (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="text-muted text-sm font-bold tracking-wide">
                {t("LOKASI SEMASA")}
              </h2>
              {prefs.current && !changing ? (
                <div className="border-line flex flex-col gap-3 rounded-[18px] border-[1.5px] p-3.5 sm:flex-row sm:items-center">
                  <LocationReading
                    location={prefs.current}
                    onSelect={() => select(prefs.current!)}
                  />
                  <div className="flex gap-2 *:flex-1 sm:*:flex-none">
                    {!prefs.favourites.some((f) =>
                      samePlace(f, prefs.current!),
                    ) &&
                      prefs.favourites.length < MAX_FAVOURITES && (
                        <button
                          type="button"
                          onClick={() =>
                            updatePrefs((p) => addFavourite(p, p.current!))
                          }
                          className="bg-surface min-h-11 rounded-xl px-3.5 text-sm font-semibold"
                        >
                          {t("Simpan")}
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={() => setChanging(true)}
                      className="bg-ink text-page min-h-11 rounded-xl px-3.5 text-sm font-semibold"
                    >
                      {t("Tukar")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-line rounded-[18px] border-[1.5px] p-4">
                  <ChooseLocation onChosen={() => setChanging(false)} />
                  {prefs.current && (
                    <button
                      type="button"
                      onClick={() => setChanging(false)}
                      className="mt-3 min-h-11 text-sm font-semibold underline"
                    >
                      {t("Batal")}
                    </button>
                  )}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-muted text-sm font-bold tracking-wide">
                {t("KEGEMARAN ({count}/{max})", {
                  count: prefs.favourites.length,
                  max: MAX_FAVOURITES,
                })}
              </h2>
              {canAlert && prefs.favourites.length > 0 && (
                <p className="text-muted -mt-1 text-xs">
                  {t(
                    "Ketik loceng untuk menerima amaran IPU bagi lokasi itu. Hidupkan amaran di Tetapan dahulu.",
                  )}
                </p>
              )}
              <FavouriteList
                favourites={prefs.favourites}
                renderRow={(f) => (
                  <>
                    <LocationReading
                      location={f}
                      onSelect={() => select(f)}
                      isCurrent={!!prefs.current && samePlace(prefs.current, f)}
                    />
                    {canAlert && (
                      <button
                        type="button"
                        aria-pressed={prefs.alertFavourites.includes(f.id)}
                        aria-label={t("Amaran IPU untuk {name}", {
                          name: f.name,
                        })}
                        onClick={() =>
                          updatePrefs((p) => toggleAlertFavourite(p, f.id))
                        }
                        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                          prefs.alertFavourites.includes(f.id)
                            ? "bg-ink text-page"
                            : "text-muted hover:bg-line"
                        }`}
                      >
                        <svg
                          aria-hidden="true"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={
                            prefs.alertFavourites.includes(f.id)
                              ? "currentColor"
                              : "none"
                          }
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={t("Buang {name} daripada kegemaran", {
                        name: f.name,
                      })}
                      onClick={() =>
                        updatePrefs((p) => removeFavourite(p, f.id))
                      }
                      className="text-muted hover:bg-line flex size-11 shrink-0 items-center justify-center rounded-full"
                    >
                      <svg
                        aria-hidden="true"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      >
                        <line x1="6" y1="6" x2="18" y2="18" />
                        <line x1="18" y1="6" x2="6" y2="18" />
                      </svg>
                    </button>
                  </>
                )}
              />

              {prefs.favourites.length < MAX_FAVOURITES &&
                (adding ? (
                  <div className="border-line rounded-[18px] border-[1.5px] p-4">
                    <LocationSearch
                      autoFocus
                      onPick={(area) => {
                        updatePrefs((p) =>
                          addFavourite(p, areaToLocation(area)),
                        );
                        setAdding(false);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setAdding(false)}
                      className="mt-3 min-h-11 text-sm font-semibold underline"
                    >
                      {t("Batal")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="border-line text-muted min-h-14 rounded-[18px] border-2 border-dashed font-semibold"
                  >
                    {t("+ Tambah lokasi kegemaran")}
                  </button>
                ))}
            </section>
          </>
        )}
      </div>
    </>
  );
}

/** Nama lokasi + IPU semasa; klik untuk jadikan lokasi semasa. */
function LocationReading({
  location,
  onSelect,
  isCurrent = false,
}: {
  location: SavedLocation;
  onSelect: () => void;
  /** Kegemaran ini ialah lokasi semasa (tanda "Semasa"). */
  isCurrent?: boolean;
}) {
  const { t } = useI18n();
  const { entry } = useReading(location);
  const current = primaryReading(entry?.reading);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold">
          {t(location.name)}
        </span>
        <span className="text-muted flex min-w-0 items-center gap-1.5 text-xs font-medium">
          <span className="truncate">
            {location.detail && t(location.detail)}
          </span>
          {isCurrent && (
            <span className="bg-ink text-page shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold tracking-wide">
              {t("SEMASA")}
            </span>
          )}
        </span>
      </span>
      {current ? (
        <span className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold">{current.ipu}</span>
          <IpuPill
            category={current.category}
            label={t(current.label)}
            className="!px-2 !text-[11px]"
          />
        </span>
      ) : entry?.status === "error" ? (
        <span className="text-muted text-xs">{t("Tiada data")}</span>
      ) : (
        <Skeleton className="h-7 w-16" />
      )}
    </button>
  );
}
