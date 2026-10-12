import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hezy — Semak Jerebu",
    short_name: "Hezy",
    description:
      "Semak Indeks Pencemar Udara (IPU) di lokasi anda dengan pantas.",
    lang: "ms",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["health", "weather"],
    // Tekan lama ikon (Android/desktop) untuk terus ke skrin ini.
    shortcuts: [
      {
        name: "Trend IPU hari ini",
        short_name: "Trend",
        url: "/trend",
        icons: [{ src: "/icons/shortcut-trend.png", sizes: "96x96" }],
      },
      {
        name: "Peta stesen dan titik panas",
        short_name: "Peta",
        url: "/lokasi#peta",
        icons: [{ src: "/icons/shortcut-peta.png", sizes: "96x96" }],
      },
      {
        name: "Tetapan dan amaran",
        short_name: "Tetapan",
        url: "/tetapan",
        icons: [{ src: "/icons/shortcut-tetapan.png", sizes: "96x96" }],
      },
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
