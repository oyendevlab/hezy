"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import type { Map as LeafletMap } from "leaflet";
import { Broadcast, Fire, Gradient, Wind, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { distanceKm, type Station } from "@/lib/apims";
import { CATEGORY_STYLE } from "@/lib/category-style";
import {
  CLUSTER_RADIUS_PX,
  CLUSTER_UNTIL_ZOOM,
  clusterPoints,
} from "@/lib/cluster";
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
import { createHeatLayer, createWindLayer } from "./map-layers";
import type { WindGrid } from "@/lib/wind-grid";
import { HEAT_STOPS } from "@/lib/heat";
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

type Translate = (
  text: string,
  vars?: Record<string, string | number>,
) => string;

/**
 * Lapisan pin yang dihimpunkan bila dizum keluar (zum < CLUSTER_UNTIL_ZOOM). Himpunan berwarna
 * ikut nilai terburuk dan dizum masuk bila diklik.
 */
function pinLayer<T extends { lat: number; lon: number }>(
  L: typeof Leaflet,
  m: LeafletMap,
  zoom: number,
  items: T[],
  options: {
    weight: (item: T) => number;
    pin: (item: T) => Leaflet.Marker;
    cluster: (items: T[]) => { html: string; title: string };
    /** Lapisan rasmi (APIMS) di atas sensor tambahan. */
    zIndexOffset?: number;
  },
): Leaflet.LayerGroup {
  const groups =
    zoom >= CLUSTER_UNTIL_ZOOM
      ? items.map((item) => [item])
      : clusterPoints(
          items.map((item) => {
            const point = m.project([item.lat, item.lon], zoom);
            return { x: point.x, y: point.y, item };
          }),
          CLUSTER_RADIUS_PX,
          options.weight,
        ).map((c) => c.items);
  return L.layerGroup(
    groups.map((group) => {
      if (group.length === 1) return options.pin(group[0]);
      const lat = group.reduce((a, i) => a + i.lat, 0) / group.length;
      const lon = group.reduce((a, i) => a + i.lon, 0) / group.length;
      const { html, title } = options.cluster(group);
      return L.marker([lat, lon], {
        title,
        keyboard: true,
        zIndexOffset: options.zIndexOffset ?? 0,
        icon: L.divIcon({
          className: "hezy-pin-wrap",
          html,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
      }).on("click", () =>
        m.fitBounds(
          L.latLngBounds(group.map((i) => [i.lat, i.lon] as [number, number])),
          { padding: [48, 48], maxZoom: CLUSTER_UNTIL_ZOOM + 1 },
        ),
      );
    }),
  );
}

function stationPin(
  L: typeof Leaflet,
  station: Station,
  onSelect: (station: Station) => void,
) {
  const key = station.ipu === null ? null : ipuCategory(station.ipu).key;
  const tintClass = key ? CATEGORY_STYLE[key].tint : "hezy-pin-na";
  const border = key ? CATEGORY_STYLE[key].accent : "#9a9a9a";
  const label = station.ipu === null ? "N/A" : String(station.ipu);
  return L.marker([station.lat, station.lon], {
    title: `${station.name}, IPU ${label}`,
    keyboard: true,
    // Stesen rasmi sentiasa di atas pin sensor tambahan.
    zIndexOffset: 1000,
    icon: L.divIcon({
      className: "hezy-pin-wrap",
      html: `<span class="hezy-pin ${tintClass}" style="border-color:${border}">${escapeHtml(label)}</span>`,
      iconSize: [44, 30],
      iconAnchor: [22, 30],
    }),
  }).on("click", () => onSelect(station));
}

function stationCluster(t: Translate, group: Station[]) {
  const worst = Math.max(...group.map((s) => s.ipu ?? -1));
  const key = worst < 0 ? null : ipuCategory(worst).key;
  const tintClass = key ? CATEGORY_STYLE[key].tint : "hezy-pin-na";
  const border = key ? CATEGORY_STYLE[key].accent : "#9a9a9a";
  return {
    html: `<span class="hezy-cluster ${tintClass}" style="border-color:${border}">${group.length}</span>`,
    title:
      worst < 0
        ? t("{count} stesen", { count: group.length })
        : t("{count} stesen, IPU tertinggi {ipu}", {
            count: group.length,
            ipu: worst,
          }),
  };
}

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
  const [showWind, setShowWind] = useState(true);
  const [showHeat, setShowHeat] = useState(false);
  const [windGrid, setWindGrid] = useState<WindGrid | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);

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
        zoomControl: false,
      });
      map.current = m;
      // Cip lapisan di kiri atas; kawalan zum ke kanan atas.
      L.control.zoom({ position: "topright" }).addTo(m);
      setZoom(m.getZoom());
      m.on("zoomend", () => setZoom(m.getZoom()));

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · APIMS (JAS)',
      }).addTo(m);

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

  // Grid angin 850 hPa untuk aliran angin (dicache 1 jam di pelayan).
  useEffect(() => {
    if (!mapReady || windGrid) return;
    let cancelled = false;
    fetch("/api/wind")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: WindGrid | null) => {
        if (!cancelled && body?.u?.length) setWindGrid(body);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [mapReady, windGrid]);

  // Aliran angin (zarah; anak panah statik untuk gerakan dikurangkan).
  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m || !showWind || !windGrid) return;
    let layer: Leaflet.Layer | null = null;
    let disposed = false;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const attribution = '<a href="https://open-meteo.com/">Open-Meteo</a>';
    void import("leaflet").then((L) => {
      if (disposed) return;
      layer = createWindLayer(L, windGrid, reduce).addTo(m);
      m.attributionControl.addAttribution(attribution);
    });
    return () => {
      disposed = true;
      layer?.remove();
      m.attributionControl.removeAttribution(attribution);
    };
  }, [mapReady, showWind, windGrid]);

  // Peta haba IPU (anggaran IDW antara stesen rasmi).
  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m || !showHeat || !stations) return;
    const points = stations.flatMap((s) =>
      s.ipu === null ? [] : [{ lat: s.lat, lon: s.lon, ipu: s.ipu }],
    );
    let layer: Leaflet.Layer | null = null;
    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed) return;
      layer = createHeatLayer(L, points).addTo(m);
    });
    return () => {
      disposed = true;
      layer?.remove();
    };
  }, [mapReady, showHeat, stations]);

  // Pin stesen APIMS: dibina semula bila zum berubah (himpunan).
  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m || !stations || zoom === null) return;
    let layer: Leaflet.LayerGroup | null = null;
    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed) return;
      layer = pinLayer(L, m, zoom, stations, {
        weight: (s) => s.ipu ?? -1,
        pin: (s) =>
          stationPin(L, s, (station) => {
            setSelectedId(station.id);
            setSensorUid(null);
          }),
        cluster: (group) => stationCluster(t, group),
        zIndexOffset: 1000,
      }).addTo(m);
    });
    return () => {
      disposed = true;
      layer?.remove();
    };
  }, [mapReady, stations, zoom, t]);

  // Escape menutup kad stesen/sensor.
  useEffect(() => {
    if (!selectedId && sensorUid === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSelectedId(null);
      setSensorUid(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId, sensorUid]);

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
      '<a href="https://firms.modaps.eosdis.nasa.gov/">NASA FIRMS</a>';
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
    if (!mapReady || !m || !showSensors || !sensors?.length || zoom === null)
      return;
    let layer: Leaflet.LayerGroup | null = null;
    let disposed = false;
    const attribution = '<a href="https://waqi.info/">WAQI</a> &amp; EPA asal';
    void import("leaflet").then((L) => {
      if (disposed) return;
      layer = pinLayer(L, m, zoom, sensors, {
        weight: (s) => s.aqi,
        pin: (sensor) =>
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
        cluster: (group) => ({
          html: `<span class="hezy-cluster hezy-pin-sensor">${group.length}</span>`,
          title: t("{count} sensor, AQI tertinggi {aqi}", {
            count: group.length,
            aqi: Math.max(...group.map((s) => s.aqi)),
          }),
        }),
      }).addTo(m);
      m.attributionControl.addAttribution(attribution);
    });
    return () => {
      disposed = true;
      layer?.remove();
      m.attributionControl.removeAttribution(attribution);
    };
  }, [mapReady, sensors, showSensors, zoom, t]);

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

  const chip = (on: boolean) =>
    `relative flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-bold shadow-[0_1px_6px_rgb(0_0_0/0.18)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${
      on ? "bg-ink text-page" : "bg-page/95 text-ink"
    }`;
  const closeSheet = () => {
    setSelectedId(null);
    setSensorUid(null);
  };
  const firesOn = showFires && fires !== null && fires.length > 0;
  const sensorsOn =
    showSensors && !!WAQI_TOKEN && sensors !== null && sensors.length > 0;

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

        {/* Cip lapisan terapung (kiri atas). */}
        <div className="pointer-events-none absolute top-3 left-3 z-[500] flex max-w-[calc(100%-64px)] flex-col items-start gap-2">
          <fieldset className="pointer-events-auto flex flex-wrap gap-2">
            <legend className="sr-only">{t("Lapisan peta")}</legend>
            {fires !== null && fires.length > 0 && (
              <label className={chip(showFires)}>
                <input
                  type="checkbox"
                  checked={showFires}
                  onChange={(e) => setShowFires(e.target.checked)}
                  className="absolute inset-0 cursor-pointer appearance-none rounded-full"
                />
                <Fire
                  aria-hidden="true"
                  size={15}
                  weight="fill"
                  className={showFires ? "" : "text-[#d23b3b]"}
                />
                {t("Titik panas ({count})", {
                  count: fires.length.toLocaleString("ms-MY"),
                })}
              </label>
            )}
            {WAQI_TOKEN && sensors !== null && sensors.length > 0 && (
              <label className={chip(showSensors)}>
                <input
                  type="checkbox"
                  checked={showSensors}
                  onChange={(e) => setShowSensors(e.target.checked)}
                  className="absolute inset-0 cursor-pointer appearance-none rounded-full"
                />
                <Broadcast aria-hidden="true" size={15} weight="bold" />
                {t("Sensor ({count})", { count: sensors.length })}
              </label>
            )}
            {stations && (
              <label className={chip(showHeat)}>
                <input
                  type="checkbox"
                  checked={showHeat}
                  onChange={(e) => setShowHeat(e.target.checked)}
                  className="absolute inset-0 cursor-pointer appearance-none rounded-full"
                />
                <Gradient aria-hidden="true" size={15} weight="bold" />
                {t("Peta haba")}
              </label>
            )}
            {(wind || windGrid) && (
              <label className={chip(showWind)}>
                <input
                  type="checkbox"
                  checked={showWind}
                  onChange={(e) => setShowWind(e.target.checked)}
                  className="absolute inset-0 cursor-pointer appearance-none rounded-full"
                />
                <Wind aria-hidden="true" size={15} weight="bold" />
                {t("Angin")}
              </label>
            )}
          </fieldset>
          {showHeat && (
            <div
              data-testid="heat-legend"
              className="bg-page/90 flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow"
            >
              <span>{t("Anggaran IPU")}</span>
              <span className="text-muted tabular-nums">0</span>
              <span
                aria-hidden="true"
                className="h-2 w-20 rounded-full"
                style={{
                  background: `linear-gradient(to right, ${HEAT_STOPS.map(
                    ([v, c]) => `${c} ${(Math.min(v, 300) / 300) * 100}%`,
                  ).join(", ")})`,
                }}
              />
              <span className="text-muted tabular-nums">300+</span>
            </div>
          )}
          {wind && showWind && (
            <div className="bg-page/90 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow">
              {wind.speed >= CALM_KMH && (
                <WindArrow direction={wind.direction} />
              )}
              {windText(wind)}
            </div>
          )}
        </div>

        {/* Kad stesen/sensor terpilih sebagai helaian di atas peta. */}
        {(sensor || selected) && (
          <div className="pointer-events-none absolute inset-x-2 bottom-2 z-[1100] md:right-auto md:bottom-3 md:left-3 md:w-[380px]">
            <div className="relative">
              {sensor && (
                <section
                  aria-live="polite"
                  data-testid="map-sheet"
                  className="bg-page sheet-up border-line pointer-events-auto flex items-start justify-between gap-3 rounded-[22px] border border-dashed p-4 pr-14 shadow-[0_8px_28px_rgb(0_0_0/0.22)]"
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
                  data-testid="map-sheet"
                  className="bg-page sheet-up pointer-events-auto flex flex-col gap-3 rounded-[22px] p-4 shadow-[0_8px_28px_rgb(0_0_0/0.22)]"
                >
                  <div className="flex items-start justify-between gap-3 pr-11">
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
                      <span className="text-muted text-sm">
                        {t("Tiada bacaan")}
                      </span>
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
                        {prefs &&
                        isFavourite(prefs, stationToLocation(selected).id)
                          ? t("Sudah disimpan")
                          : t("Kegemaran penuh")}
                      </span>
                    )}
                  </div>
                </section>
              )}
              <button
                type="button"
                onClick={closeSheet}
                aria-label={t("Tutup")}
                className="bg-surface hover:bg-line pointer-events-auto absolute top-3 right-3 flex size-9 items-center justify-center rounded-full"
              >
                <X aria-hidden="true" size={16} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>

      {(firesOn || sensorsOn || showHeat || (showWind && windGrid)) && (
        <div className="text-muted flex flex-col gap-1.5 text-xs">
          {showHeat && (
            <p>
              {t(
                "Peta haba ialah anggaran antara stesen APIMS (interpolasi), bukan bacaan rasmi. Kawasan jauh dari stesen dibiarkan kosong.",
              )}
            </p>
          )}
          {showWind && windGrid && (
            <p>
              {t(
                "Garisan bergerak menunjukkan aliran angin pada ~1.5 km (850 hPa) yang membawa asap jerebu. Sumber: Open-Meteo.",
              )}
            </p>
          )}
          {firesOn && (
            <p>
              <span
                aria-hidden="true"
                className="mr-1.5 inline-block size-2.5 rounded-full bg-[#d23b3b]"
              />
              {t(
                "Titik merah ialah kebakaran yang dikesan satelit VIIRS dalam 2 hari terakhir (setiap titik ≈ kawasan 5 km). Satelit tidak mengesan semua kebakaran, terutama api gambut di bawah permukaan atau di bawah awan.",
              )}{" "}
              {t("Sumber: NASA FIRMS.")}
            </p>
          )}
          {sensorsOn && (
            <p>
              {t(
                "Pin bergaris putus ialah sensor tambahan dalam skala AQI AS, yang biasanya lebih tinggi daripada IPU bagi udara yang sama. Nombor utama dan amaran Hezy kekal menggunakan IPU rasmi.",
              )}
            </p>
          )}
        </div>
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
