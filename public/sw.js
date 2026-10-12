/* Service worker Hezy: cache aplikasi supaya boleh dibuka tanpa internet.
 * Bacaan IPU (/api/*) TIDAK dicache di sini — aplikasi menyimpannya sendiri dalam localStorage. */

const VERSION = "v3";
const SHELL = `hezy-shell-${VERSION}`;
const STATIC = `hezy-static-${VERSION}`;
const STATIC_LIMIT = 150;
const PRECACHE = [
  "/",
  "/trend",
  "/lokasi",
  "/tetapan",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("hezy-") && key !== SHELL && key !== STATIC,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Aplikasi menghantar senarai fail statik yang dimuatkan sebelum SW aktif. */
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_URLS" || !Array.isArray(event.data.urls))
    return;
  const urls = event.data.urls.filter(
    (u) => typeof u === "string" && isStatic(new URL(u, self.location.origin)),
  );
  event.waitUntil(
    caches
      .open(STATIC)
      .then((cache) => cache.addAll(urls))
      .catch(() => {}),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/"))
    return;

  event.respondWith(
    isStatic(url) ? cacheFirst(request) : networkFirst(request),
  );
});

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  );
}

/** Fail statik Next mempunyai hash dalam nama, jadi selamat dicache selama-lamanya. */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC);
    await cache.put(request, response.clone());
    const keys = await cache.keys();
    await Promise.all(
      keys
        .slice(0, Math.max(0, keys.length - STATIC_LIMIT))
        .map((key) => cache.delete(key)),
    );
  }
  return response;
}

/** Halaman: cuba rangkaian dahulu supaya sentiasa terkini; guna cache bila luar talian. */
async function networkFirst(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;
    if (request.mode === "navigate") {
      const page =
        (await cache.match(new URL(request.url).pathname)) ??
        (await cache.match("/"));
      if (page) return page;
    }
    throw error;
  }
}

/* Notifikasi amaran IPU (dihantar oleh /api/push/check). */
self.addEventListener("push", (event) => {
  let data = {
    title: "Hezy",
    body: "Kemas kini kualiti udara",
    url: "/",
    tag: "hezy-ipu",
  };
  try {
    data = { ...data, ...event.data?.json() };
  } catch {
    // Muatan bukan JSON: guna teks lalai.
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      renotify: true,
      lang: "ms",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? "/", self.location.origin)
    .href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const open = windows.find((w) =>
          w.url.startsWith(self.location.origin),
        );
        return open
          ? open.focus().then((w) => w.navigate(url))
          : self.clients.openWindow(url);
      }),
  );
});
