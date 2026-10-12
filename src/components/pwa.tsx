"use client";

import { useEffect } from "react";
import { listenForInstall } from "@/lib/install";
import {
  alertLocations,
  effectiveThreshold,
  pushOptions,
  usePrefs,
} from "@/lib/prefs";
import { syncPushSettings } from "@/lib/push-client";
import { useI18n } from "@/lib/use-i18n";
import { useOnline } from "@/lib/online";
import { refreshStaleReadings } from "@/lib/use-reading";

/** Daftar service worker (production sahaja) dan dengar peristiwa pemasangan. */
export function PwaSetup() {
  useEffect(() => {
    listenForInstall();
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        // Fail statik yang dimuatkan sebelum SW aktif belum dicache; hantar senarainya.
        const urls = performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((url) => url.startsWith(`${location.origin}/_next/static/`));
        registration.active?.postMessage({ type: "CACHE_URLS", urls });
      })
      .catch(() => {
        // Tanpa SW, aplikasi masih berfungsi dalam talian.
      });
  }, []);

  // Bila kembali ke aplikasi/tab atau sambungan pulih: ambil semula bacaan yang > 10 minit.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshStaleReadings();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", refreshStaleReadings);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", refreshStaleReadings);
    };
  }, []);

  // Amaran push ikut lokasi (semasa + kegemaran) dan ambang: kemas kini pelayan bila berubah.
  const prefs = usePrefs();
  useEffect(() => {
    if (!prefs || process.env.NODE_ENV !== "production") return;
    void syncPushSettings(
      alertLocations(prefs),
      effectiveThreshold(prefs),
      prefs.lang,
      pushOptions(prefs),
    );
  }, [prefs]);

  return null;
}

export function OfflineBanner() {
  const online = useOnline();
  const { t } = useI18n();
  if (online) return null;
  return (
    <div
      role="status"
      className="bg-ink text-page sticky top-0 z-20 px-5 py-2.5 text-center text-sm font-semibold"
    >
      {t("Luar talian · Memaparkan bacaan terakhir yang disimpan")}
    </div>
  );
}
