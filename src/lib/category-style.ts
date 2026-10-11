import type { IpuCategoryKey } from "./ipu";

export type SkyPalette = {
  sky: string;
  sun: string;
  sunOpacity: number;
  far: string;
  near: string;
  /** Kabus di antara lapisan bangunan jauh dan dekat. */
  haze: number;
  /** Kabus di atas semua lapisan. */
  hazeTop: number;
};

type CategoryStyle = {
  /** Kelas Tailwind untuk pil/latar berwarna (tint + teks gelap). */
  tint: string;
  /** Warna aksen untuk graf dan titik. */
  accent: string;
  sky: SkyPalette;
};

// Kelas ditulis penuh supaya Tailwind dapat mengesannya.
export const CATEGORY_STYLE: Record<IpuCategoryKey, CategoryStyle> = {
  baik: {
    tint: "bg-ipu-baik-tint text-ipu-baik-ink",
    accent: "#3a7bd5",
    sky: {
      sky: "#9ecdf3",
      sun: "#ffd45c",
      sunOpacity: 1,
      far: "#7fa8cb",
      near: "#3d5f7e",
      haze: 0,
      hazeTop: 0,
    },
  },
  sederhana: {
    tint: "bg-ipu-sederhana-tint text-ipu-sederhana-ink",
    accent: "#2e9e5b",
    sky: {
      sky: "#bbd9e5",
      sun: "#ffd45c",
      sunOpacity: 0.9,
      far: "#94afc0",
      near: "#4a6577",
      haze: 0.12,
      hazeTop: 0.04,
    },
  },
  "tidak-sihat": {
    tint: "bg-ipu-tidak-sihat-tint text-ipu-tidak-sihat-ink",
    accent: "#e0a800",
    sky: {
      sky: "#e7d4a4",
      sun: "#f6c453",
      sunOpacity: 0.55,
      far: "#c3b18b",
      near: "#6e6450",
      haze: 0.32,
      hazeTop: 0.12,
    },
  },
  "sangat-tidak-sihat": {
    tint: "bg-ipu-sangat-tidak-sihat-tint text-ipu-sangat-tidak-sihat-ink",
    accent: "#e8731c",
    sky: {
      sky: "#e3b98f",
      sun: "#f0a55a",
      sunOpacity: 0.3,
      far: "#c49d7b",
      near: "#6e5443",
      haze: 0.45,
      hazeTop: 0.22,
    },
  },
  berbahaya: {
    tint: "bg-ipu-berbahaya-tint text-ipu-berbahaya-ink",
    accent: "#d23b3b",
    sky: {
      sky: "#c99b8f",
      sun: "#e08a6a",
      sunOpacity: 0.12,
      far: "#a88579",
      near: "#5a4440",
      haze: 0.55,
      hazeTop: 0.32,
    },
  },
};

/** Langit neutral semasa bacaan belum tersedia. */
export const NEUTRAL_SKY: SkyPalette = {
  sky: "#dfe3e6",
  sun: "#f2f2f2",
  sunOpacity: 0.6,
  far: "#c7cdd2",
  near: "#8e979e",
  haze: 0.2,
  hazeTop: 0.1,
};
