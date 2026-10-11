"use client";

import { useEffect } from "react";
import { listenForInstall } from "@/lib/install";
import { usePrefs } from "@/lib/prefs";
import { syncPushLocation } from "@/lib/push-client";
import { useOnline } from "@/lib/online";

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

  // Amaran push mengikut lokasi semasa: kemas kini pelayan bila lokasi bertukar.
  const current = usePrefs()?.current ?? null;
  useEffect(() => {
    if (current && process.env.NODE_ENV === "production")
      void syncPushLocation(current);
  }, [current]);

  return null;
}

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="bg-ink text-page sticky top-0 z-20 px-5 py-2.5 text-center text-sm font-semibold"
    >
      Luar talian · Memaparkan bacaan terakhir yang disimpan
    </div>
  );
}
