"use client";

import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { distanceKm, type Station } from "@/lib/apims";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { formatClock } from "@/lib/format";
import { ipuCategory } from "@/lib/ipu";
import {
  MAX_FAVOURITES,
  addFavourite,
  isFavourite,
  updatePrefs,
  usePrefs,
  type SavedLocation,
} from "@/lib/prefs";
import { IpuPill } from "./ipu-pill";
import { Notice, Skeleton } from "./status";

/** Pusat Malaysia (Semenanjung + Borneo) bila tiada lokasi semasa. */
const MALAYSIA_CENTER: [number, number] = [4.2, 108.5];

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; stations: Station[] };

function stationToLocation(station: Station): SavedLocation {
  return {
    id: `stesen:${station.id}`,
    name: station.name,
    detail: `Stesen APIMS · ${station.state}`,
    lat: station.lat,
    lon: station.lon,
    source: "area",
  };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Peta stesen APIMS (Leaflet + OpenStreetMap) dengan pin berwarna ikut IPU rasmi. */
export function StationMap() {
  const prefs = usePrefs();
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Ambil senarai stesen.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/stations")
      .then(async (res) => {
        const body = (await res.json()) as
          { stations: Station[] } | { error: string };
        if (!res.ok || "error" in body) {
          throw new Error(
            "error" in body ? body.error : `Status ${res.status}`,
          );
        }
        if (!cancelled) setState({ status: "ready", stations: body.stations });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            error instanceof TypeError
              ? "Tiada sambungan internet. Peta memerlukan internet."
              : error instanceof Error
                ? error.message
                : "Ralat tidak diketahui.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const stations = state.status === "ready" ? state.stations : null;
  const current = prefs?.current ?? null;

  // Bina peta selepas stesen dimuatkan.
  useEffect(() => {
    if (!stations || !container.current) return;
    let disposed = false;

    void import("leaflet").then((L) => {
      if (disposed || !container.current) return;
      const center: [number, number] = current
        ? [current.lat, current.lon]
        : MALAYSIA_CENTER;
      const m = L.map(container.current, {
        center,
        zoom: current ? 9 : 5,
        zoomControl: true,
      });
      map.current = m;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Data IPU: APIMS (JAS)',
      }).addTo(m);

      for (const station of stations) {
        const key = station.ipu === null ? null : ipuCategory(station.ipu).key;
        const tintClass = key ? CATEGORY_STYLE[key].tint : "hezy-pin-na";
        const border = key ? CATEGORY_STYLE[key].accent : "#9a9a9a";
        const label = station.ipu === null ? "N/A" : String(station.ipu);
        const marker = L.marker([station.lat, station.lon], {
          title: `${station.name}, IPU ${label}`,
          keyboard: true,
          icon: L.divIcon({
            className: "hezy-pin-wrap",
            html: `<span class="hezy-pin ${tintClass}" style="border-color:${border}">${escapeHtml(label)}</span>`,
            iconSize: [44, 30],
            iconAnchor: [22, 30],
          }),
        });
        marker.on("click", () => setSelectedId(station.id));
        marker.addTo(m);
      }
    });

    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
    };
    // Peta hanya dibina semula bila senarai stesen berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations]);

  if (state.status === "error") {
    return (
      <Notice
        action={{
          label: "Cuba lagi",
          onClick: () => {
            setState({ status: "loading" });
            setAttempt((n) => n + 1);
          },
        }}
      >
        {state.message}
      </Notice>
    );
  }

  const selected = stations?.find((s) => s.id === selectedId) ?? null;
  const nearby =
    stations && current
      ? stations
          .filter((s) => s.ipu !== null)
          .map((s) => ({ station: s, km: distanceKm(current, s) }))
          .sort((a, b) => a.km - b.km)
          .slice(0, 5)
      : [];

  const choose = (station: Station) => {
    updatePrefs((p) => ({ ...p, current: stationToLocation(station) }));
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        {state.status === "loading" && (
          <Skeleton className="absolute inset-0 z-[1] h-full" />
        )}
        <div
          ref={container}
          role="region"
          aria-label="Peta stesen APIMS"
          className="border-line h-[420px] overflow-hidden rounded-3xl border md:h-[520px]"
        />
      </div>

      {selected && (
        <section
          aria-live="polite"
          className="border-line flex flex-col gap-3 rounded-[22px] border p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-muted text-xs font-semibold">
                Stesen APIMS · {selected.state}
                {current
                  ? ` · ${Math.round(distanceKm(current, selected))} km`
                  : ""}
              </div>
              <h2 className="font-display text-[22px] font-bold">
                {selected.name}
              </h2>
              {selected.time && (
                <div className="text-muted text-xs">
                  {formatClock(selected.time)}
                  {selected.pollutant ? ` · ${selected.pollutant}` : ""}
                </div>
              )}
            </div>
            {selected.ipu !== null ? (
              <div className="flex flex-col items-end gap-1">
                <span className="font-display text-[34px] leading-none font-bold">
                  {selected.ipu}
                </span>
                <IpuPill
                  category={ipuCategory(selected.ipu).key}
                  label={ipuCategory(selected.ipu).label}
                  className="!px-2 !text-[11px]"
                />
              </div>
            ) : (
              <span className="text-muted text-sm">Tiada bacaan</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => choose(selected)}
              className="bg-ink text-page min-h-11 rounded-xl text-sm font-semibold"
            >
              Jadikan lokasi semasa
            </button>
            {prefs &&
            !isFavourite(prefs, stationToLocation(selected).id) &&
            prefs.favourites.length < MAX_FAVOURITES ? (
              <button
                type="button"
                onClick={() =>
                  updatePrefs((p) =>
                    addFavourite(p, stationToLocation(selected)),
                  )
                }
                className="bg-surface min-h-11 rounded-xl text-sm font-semibold"
              >
                Simpan
              </button>
            ) : (
              <span className="text-muted flex min-h-11 items-center justify-center text-sm">
                {prefs && isFavourite(prefs, stationToLocation(selected).id)
                  ? "Sudah disimpan"
                  : "Kegemaran penuh"}
              </span>
            )}
          </div>
        </section>
      )}

      {nearby.length > 0 && (
        <section aria-labelledby="stesen-terdekat">
          <h2
            id="stesen-terdekat"
            className="text-muted mb-2 text-sm font-bold tracking-wide"
          >
            STESEN TERDEKAT
          </h2>
          <ul className="divide-line bg-surface divide-y rounded-2xl">
            {nearby.map(({ station, km }) => (
              <li key={station.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(station.id);
                    map.current?.setView([station.lat, station.lon], 11);
                  }}
                  className="flex min-h-13 w-full items-center gap-3 px-4 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">
                      {station.name}
                    </span>
                    <span className="text-muted block text-xs">
                      {station.state} · {Math.round(km)} km
                    </span>
                  </span>
                  <span className="font-display text-xl font-bold">
                    {station.ipu}
                  </span>
                  <IpuPill
                    category={ipuCategory(station.ipu!).key}
                    label={ipuCategory(station.ipu!).label}
                    className="!px-2 !text-[11px]"
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
