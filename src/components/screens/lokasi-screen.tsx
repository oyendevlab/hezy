"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { areaToLocation } from "@/lib/locations";
import {
  MAX_FAVOURITES,
  addFavourite,
  isFavourite,
  removeFavourite,
  updatePrefs,
  usePrefs,
  type SavedLocation,
} from "@/lib/prefs";
import { useReading } from "@/lib/use-reading";
import { ChooseLocation } from "../choose-location";
import { IpuPill } from "../ipu-pill";
import { LocationSearch } from "../location-search";
import { Skeleton } from "../status";

export function LokasiScreen() {
  const prefs = usePrefs();
  const router = useRouter();
  const [view, setView] = useState<"list" | "map">("list");
  const [changing, setChanging] = useState(false);
  const [adding, setAdding] = useState(false);

  const select = (location: SavedLocation) => {
    updatePrefs((p) => ({ ...p, current: location }));
    router.push("/");
  };

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-5 px-5 pt-13 md:px-10 md:pt-10">
      <h1 className="font-display text-[30px] font-bold">Lokasi</h1>

      <div
        role="tablist"
        aria-label="Paparan lokasi"
        className="bg-surface grid grid-cols-2 gap-1 rounded-2xl p-1"
      >
        {(["list", "map"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`min-h-10 rounded-xl text-sm ${view === v ? "bg-page font-bold" : "text-muted font-medium"}`}
          >
            {v === "list" ? "Senarai" : "Peta"}
          </button>
        ))}
      </div>

      {view === "map" && (
        <div className="bg-surface rounded-3xl p-6 text-[15px]">
          <p className="font-bold">Peta stesen akan datang</p>
          <p className="text-muted mt-1">
            Paparan peta dengan pin stesen akan ditambah dalam fasa seterusnya.
            Buat masa ini, gunakan carian di tab Senarai.
          </p>
        </div>
      )}

      {view === "list" && prefs === null && <Skeleton className="h-64" />}

      {view === "list" && prefs && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-muted text-sm font-bold tracking-wide">
              LOKASI SEMASA
            </h2>
            {prefs.current && !changing ? (
              <div className="border-line flex flex-col gap-3 rounded-[18px] border-[1.5px] p-3.5 sm:flex-row sm:items-center">
                <LocationReading
                  location={prefs.current}
                  onSelect={() => select(prefs.current!)}
                />
                <div className="flex gap-2 *:flex-1 sm:*:flex-none">
                  {!isFavourite(prefs, prefs.current.id) &&
                    prefs.favourites.length < MAX_FAVOURITES && (
                      <button
                        type="button"
                        onClick={() =>
                          updatePrefs((p) => addFavourite(p, p.current!))
                        }
                        className="bg-surface min-h-11 rounded-xl px-3.5 text-sm font-semibold"
                      >
                        Simpan
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() => setChanging(true)}
                    className="bg-ink text-page min-h-11 rounded-xl px-3.5 text-sm font-semibold"
                  >
                    Tukar
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
                    Batal
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-muted text-sm font-bold tracking-wide">
              KEGEMARAN ({prefs.favourites.length}/{MAX_FAVOURITES})
            </h2>
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {prefs.favourites.map((f) => (
                <li
                  key={f.id}
                  className="bg-surface flex items-center gap-2 rounded-[18px] p-3.5"
                >
                  <LocationReading location={f} onSelect={() => select(f)} />
                  <button
                    type="button"
                    aria-label={`Buang ${f.name} daripada kegemaran`}
                    onClick={() => updatePrefs((p) => removeFavourite(p, f.id))}
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
                </li>
              ))}
            </ul>

            {prefs.favourites.length < MAX_FAVOURITES &&
              (adding ? (
                <div className="border-line rounded-[18px] border-[1.5px] p-4">
                  <LocationSearch
                    autoFocus
                    onPick={(area) => {
                      updatePrefs((p) => addFavourite(p, areaToLocation(area)));
                      setAdding(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setAdding(false)}
                    className="mt-3 min-h-11 text-sm font-semibold underline"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="border-line text-muted min-h-14 rounded-[18px] border-2 border-dashed font-semibold"
                >
                  + Tambah lokasi kegemaran
                </button>
              ))}
          </section>
        </>
      )}
    </div>
  );
}

/** Nama lokasi + IPU semasa; klik untuk jadikan lokasi semasa. */
function LocationReading({
  location,
  onSelect,
}: {
  location: SavedLocation;
  onSelect: () => void;
}) {
  const { entry } = useReading(location);
  const current = entry?.reading?.current;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold">
          {location.name}
        </span>
        <span className="text-muted block text-xs font-medium">
          {location.detail}
        </span>
      </span>
      {current ? (
        <span className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold">{current.ipu}</span>
          <IpuPill
            category={current.category}
            label={current.label}
            className="!px-2 !text-[11px]"
          />
        </span>
      ) : entry?.status === "error" ? (
        <span className="text-muted text-xs">Tiada data</span>
      ) : (
        <Skeleton className="h-7 w-16" />
      )}
    </button>
  );
}
