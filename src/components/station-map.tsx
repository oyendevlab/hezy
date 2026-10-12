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
import { useI18n } from "@/lib/use-i18n";
import {
  WAQI_TOKEN,
  parseSensors,
  waqiBoundsUrl,
  type Sensor,
} from "@/lib/waqi";
import type { HotspotCell } from "@/lib/hotspots";
import { useReading } from "@/lib/use-reading";
import { CALM_KMH } from "@/lib/wind";
import { IpuPill } from "./ipu-pill";
import { WindArrow, useWindText } from "./wind-line";
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
  const { t, lang } = useI18n();
  const prefs = usePrefs();
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [sensors, setSensors] = useState<Sensor[] | null>(null);
  const [showSensors, setShowSensors] = useState(true);
  const [sensorUid, setSensorUid] = useState<number | null>(null);
  const [fires, setFires] = useState<HotspotCell[] | null>(null);
  const [showFires, setShowFires] = useState(true);

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
  const wind = useReading(current).entry?.reading?.wind ?? null;
  const windText = useWindText();

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
        marker.on("click", () => {
          setSelectedId(station.id);
          setSensorUid(null);
        });
        marker.addTo(m);
      }
      setMapReady(true);
    });

    return () => {
      disposed = true;
      setMapReady(false);
      map.current?.remove();
      map.current = null;
    };
    // Peta hanya dibina semula bila senarai stesen berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations]);

  // Sensor tambahan WAQI: diambil terus dari pelayar selepas stesen APIMS (untuk buang pendua).
  useEffect(() => {
    if (!stations || !WAQI_TOKEN) return;
    let cancelled = false;
    fetch(waqiBoundsUrl(WAQI_TOKEN))
      .then((res) => res.json())
      .then((body: unknown) => {
        if (!cancelled) setSensors(parseSensors(body, stations, new Date()));
      })
      .catch(() => {
        // Lapisan tambahan sahaja: peta APIMS kekal berfungsi.
      });
    return () => {
      cancelled = true;
    };
  }, [stations]);

  // Titik panas NASA FIRMS (dicache di pelayan 1 jam).
  useEffect(() => {
    if (!mapReady || fires !== null) return;
    let cancelled = false;
    fetch("/api/hotspots")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { cells?: HotspotCell[] } | null) => {
        if (!cancelled && body?.cells) setFires(body.cells);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [mapReady, fires]);

  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m || !showFires || !fires?.length) return;
    let layer: import("leaflet").LayerGroup | null = null;
    let renderer: import("leaflet").Canvas | null = null;
    let disposed = false;
    const attribution =
      'Titik panas: <a href="https://firms.modaps.eosdis.nasa.gov/">NASA FIRMS</a>';
    void import("leaflet").then((L) => {
      if (disposed) return;
      // Kanvas: ribuan titik tanpa elemen DOM berasingan.
      renderer = L.canvas({ padding: 0.5 });
      layer = L.layerGroup(
        fires.map(([lat, lon, count]) =>
          L.circleMarker([lat, lon], {
            renderer: renderer!,
            radius: 2.5 + Math.min(count, 6) * 0.5,
            stroke: false,
            fillColor: "#d23b3b",
            fillOpacity: 0.75,
            interactive: false,
          }),
        ),
      ).addTo(m);
      m.attributionControl.addAttribution(attribution);
    });
    return () => {
      disposed = true;
      layer?.remove();
      renderer?.remove();
      m.attributionControl.removeAttribution(attribution);
    };
  }, [mapReady, fires, showFires]);

  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m || !showSensors || !sensors?.length) return;
    let layer: import("leaflet").LayerGroup | null = null;
    let disposed = false;
    const attribution =
      'Sensor tambahan: <a href="https://waqi.info/">WAQI</a> &amp; EPA asal';
    void import("leaflet").then((L) => {
      if (disposed) return;
      layer = L.layerGroup(
        sensors.map((sensor) =>
          L.marker([sensor.lat, sensor.lon], {
            title: `${sensor.name}, AQI ${sensor.aqi}`,
            keyboard: true,
            icon: L.divIcon({
              className: "hezy-pin-wrap",
              html: `<span class="hezy-pin hezy-pin-sensor">${sensor.aqi}</span>`,
              iconSize: [44, 30],
              iconAnchor: [22, 30],
            }),
          }).on("click", () => {
            setSensorUid(sensor.uid);
            setSelectedId(null);
          }),
        ),
      ).addTo(m);
      m.attributionControl.addAttribution(attribution);
    });
    return () => {
      disposed = true;
      layer?.remove();
      m.attributionControl.removeAttribution(attribution);
    };
  }, [mapReady, sensors, showSensors]);

  if (state.status === "error") {
    return (
      <Notice
        action={{
          label: t("Cuba lagi"),
          onClick: () => {
            setState({ status: "loading" });
            setAttempt((n) => n + 1);
          },
        }}
      >
        {t(state.message)}
      </Notice>
    );
  }

  const selected = stations?.find((s) => s.id === selectedId) ?? null;
  const sensor =
    (showSensors && sensors?.find((s) => s.uid === sensorUid)) || null;
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
          aria-label={t("Peta stesen APIMS")}
          className="border-line h-[420px] overflow-hidden rounded-3xl border md:h-[520px]"
        />
        {wind && (
          <div className="bg-page/90 pointer-events-none absolute top-3 right-3 z-[500] flex max-w-[70%] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow">
            {wind.speed >= CALM_KMH && <WindArrow direction={wind.direction} />}
            {windText(wind)}
          </div>
        )}
      </div>

      {fires !== null && fires.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="bg-surface flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold">
            <input
              type="checkbox"
              checked={showFires}
              onChange={(e) => setShowFires(e.target.checked)}
              className="size-4 accent-[#1c1a16]"
            />
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-full bg-[#d23b3b]"
            />
            {t("Titik panas ({count}) · NASA FIRMS, 2 hari", {
              count: fires.length.toLocaleString("ms-MY"),
            })}
          </label>
          <p className="text-muted text-xs">
            {t(
              "Titik merah ialah kebakaran yang dikesan satelit VIIRS dalam 2 hari terakhir (setiap titik ≈ kawasan 5 km). Satelit tidak mengesan semua kebakaran, terutama api gambut di bawah permukaan atau di bawah awan.",
            )}
          </p>
        </div>
      )}

      {WAQI_TOKEN && sensors !== null && sensors.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="bg-surface flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold">
            <input
              type="checkbox"
              checked={showSensors}
              onChange={(e) => setShowSensors(e.target.checked)}
              className="size-4 accent-[#1c1a16]"
            />
            <span
              aria-hidden="true"
              className="hezy-pin hezy-pin-sensor !h-6 !min-w-9 !text-xs"
            >
              AQI
            </span>
            {t("Sensor tambahan ({count}) · WAQI", { count: sensors.length })}
          </label>
          <p className="text-muted text-xs">
            {t(
              "Pin bergaris putus ialah sensor tambahan dalam skala AQI AS, yang biasanya lebih tinggi daripada IPU bagi udara yang sama. Nombor utama dan amaran Hezy kekal menggunakan IPU rasmi.",
            )}
          </p>
        </div>
      )}

      {sensor && (
        <section
          aria-live="polite"
          className="border-line flex items-start justify-between gap-3 rounded-[22px] border border-dashed p-4"
        >
          <div className="min-w-0">
            <div className="text-muted text-xs font-semibold">
              {t("Sensor tambahan WAQI · skala AQI AS")}
              {current
                ? ` · ${Math.round(distanceKm(current, sensor))} km`
                : ""}
            </div>
            <h2 className="font-display text-[22px] font-bold break-words">
              {sensor.name}
            </h2>
            <div className="text-muted text-xs">
              {formatClock(sensor.time, lang)} ·{" "}
              <a
                href="https://waqi.info/"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                World Air Quality Index Project
              </a>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-display text-[34px] leading-none font-bold">
              {sensor.aqi}
            </span>
            <span className="text-muted text-xs font-semibold">
              {t("AQI AS")}
            </span>
          </div>
        </section>
      )}

      {selected && (
        <section
          aria-live="polite"
          className="border-line flex flex-col gap-3 rounded-[22px] border p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-muted text-xs font-semibold">
                {t("Stesen APIMS · {state}", { state: selected.state })}
                {current
                  ? ` · ${Math.round(distanceKm(current, selected))} km`
                  : ""}
              </div>
              <h2 className="font-display text-[22px] font-bold">
                {selected.name}
              </h2>
              {selected.time && (
                <div className="text-muted text-xs">
                  {formatClock(selected.time, lang)}
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
                  label={t(ipuCategory(selected.ipu).label)}
                  className="!px-2 !text-[11px]"
                />
              </div>
            ) : (
              <span className="text-muted text-sm">{t("Tiada bacaan")}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => choose(selected)}
              className="bg-ink text-page min-h-11 rounded-xl text-sm font-semibold"
            >
              {t("Jadikan lokasi semasa")}
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
                {t("Simpan")}
              </button>
            ) : (
              <span className="text-muted flex min-h-11 items-center justify-center text-sm">
                {prefs && isFavourite(prefs, stationToLocation(selected).id)
                  ? t("Sudah disimpan")
                  : t("Kegemaran penuh")}
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
            {t("STESEN TERDEKAT")}
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
                    label={t(ipuCategory(station.ipu!).label)}
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
