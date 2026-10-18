import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Bar alat Vercel (komen) hanya pada deployment preview.
const vercelLive =
  process.env.VERCEL_ENV === "preview" ? " https://vercel.live" : "";

/**
 * CSP tanpa nonce (v0.8.1) supaya halaman kekal statik dan pantas. Skrip sebaris Next dan skrip
 * tema memerlukan 'unsafe-inline'; perlindungan utama ialah sekatan asal untuk sambungan, imej,
 * bingkai, borang dan objek. Hos luaran: jubin peta OSM sahaja (WAQI melalui /api/waqi sejak v0.8.6).
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${vercelLive}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://tile.openstreetmap.org${vercelLive}`,
  `font-src 'self' data:${vercelLive}`,
  `connect-src 'self'${vercelLive}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  `frame-src ${vercelLive ? vercelLive.trim() : "'none'"}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Hanya di Vercel (HTTPS); `next start` tempatan untuk E2E berjalan di http://localhost.
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Muat hanya ikon Phosphor yang digunakan (tidak dalam senarai lalai Next).
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // Pelayar meminta /favicon.ico secara automatik walaupun <link rel="icon"> ada.
    return [{ source: "/favicon.ico", destination: "/icons/icon-192.png" }];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: CSP },
          // Pelayar lama yang tidak memahami frame-ancestors.
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), browsing-topics=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
      {
        // Ikon, bendera, splash dan kredit jarang berubah: cache 7 hari (v0.8.14). Lalai `public/`
        // ialah `max-age=0`, jadi pelayar menyemak semula setiap kali (~5,000 permintaan CDN sehari).
        source: "/:dir(icons|flags|splash|kredit)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Manifest boleh berubah dengan keluaran: 1 hari.
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        // Service worker mesti sentiasa terkini supaya kemas kini aplikasi sampai kepada pengguna.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
