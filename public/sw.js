/* Aurion Maintenance service worker — installable PWA app-shell caching +
   offline fallback + Web Push. Never caches auth or API responses. */
const CACHE = "aurion-shell-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  "/offline.html",
  "/icon.svg",
  "/aurion-logo.png",
  "/manifest.json",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// Let the page trigger an immediate activation when a new SW is waiting.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// ---- Web Push: lock-screen alert with the SYSTEM sound + vibration ----
self.addEventListener("push", (event) => {
  let data = { title: "Aurion Maintenance", body: "", url: "/", tag: undefined, urgent: false };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      // Per-issue tag + renotify so every new issue re-alerts (not coalesced).
      renotify: true,
      // Never silent — let the OS play its default notification sound.
      silent: false,
      // Stronger buzz + persistent banner for urgent/safety.
      vibrate: data.urgent ? [300, 150, 300, 150, 300] : [200, 100, 200],
      requireInteraction: !!data.urgent,
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(url).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GETs. Never touch auth/API/Supabase/Groq.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Navigations: network-first, fall back to the offline page when truly offline.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Static assets: cache-first with background refresh (stale-while-revalidate).
  if (url.pathname.startsWith("/_next/static/") || PRECACHE.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
