/* Vinkällarens service worker: skrivs för hand så att den fungerar med Turbopack.
 *  - Sidor och data: nätet först, sparad kopia om nätet saknas (bläddra offline).
 *  - Byggfiler (/_next/static) och ikoner: cache först, de har unika namn.
 *  - Bilder (/api/bild): cache först med uppdatering i bakgrunden.
 *  - Allt som skriver (POST m.m.) går alltid till nätet. */
const VERSION = "vk-v3";
const SIDOR = `${VERSION}-sidor`;
const STATISKT = `${VERSION}-statiskt`;
const BILDER = `${VERSION}-bilder`;
const KARNA = ["/", "/offline", "/logga-in", "/historik", "/smakprofil", "/onskelista", "/provning", "/statistik", "/mer", "/lagg-till"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(SIDOR)
      .then((c) => c.addAll(["/offline", "/"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((nycklar) => Promise.all(nycklar.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const arHtml = (res) => (res.headers.get("content-type") || "").includes("text/html");

/** Sidor: nätet först, sparad kopia om nätet saknas. Bara riktiga HTML-sidor sparas (aldrig Nexts interna sidodata). */
async function natetForst(req) {
  const cache = await caches.open(SIDOR);
  try {
    const res = await fetch(req);
    // spara inte omdirigeringar (t.ex. till inloggningen) som om de vore sidan
    if (res.ok && res.type === "basic" && !res.redirected && arHtml(res)) cache.put(req.url, res.clone());
    return res;
  } catch {
    const sparad = await cache.match(req.url, { ignoreSearch: true, ignoreVary: true });
    if (sparad && arHtml(sparad)) return sparad;
    return (await cache.match("/offline")) || Response.error();
  }
}

async function cacheForst(req, namn, uppdatera) {
  const cache = await caches.open(namn);
  const sparad = await cache.match(req);
  const hamta = fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  });
  if (sparad) {
    if (uppdatera) hamta.catch(() => {});
    return sparad;
  }
  return hamta;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/webpack-hmr") || url.pathname === "/sw.js") return;
  // Nexts interna sidodata (klientnavigering) rörs aldrig: samma adress kan ge både HTML och data
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) return;
  // exporten ska alltid vara färsk
  if (url.pathname.startsWith("/api/export") || url.pathname.startsWith("/api/ai")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/ikoner/")) {
    e.respondWith(cacheForst(req, STATISKT, false));
  } else if (url.pathname.startsWith("/api/bild/")) {
    e.respondWith(cacheForst(req, BILDER, true));
  } else if (req.mode === "navigate") {
    e.respondWith(natetForst(req));
  }
  // allt annat (inklusive Nexts sidodata för klientnavigering) går orört till nätet
});

/* Appen skickar sina viktigaste sidor (och flaskorna i samlingen) så att de finns offline
 * även om de inte har besökts. Hämtas en i taget för att inte belasta servern. */
self.addEventListener("message", (e) => {
  if (e.data?.typ !== "forvarma") return;
  const urls = [...new Set([...KARNA, ...(e.data.urls || [])])].filter((u) => typeof u === "string" && u.startsWith("/"));
  e.waitUntil(
    (async () => {
      const cache = await caches.open(SIDOR);
      const statiskt = await caches.open(STATISKT);
      const filer = new Set();
      for (const u of urls.slice(0, 200)) {
        try {
          const res = await fetch(u, { credentials: "same-origin" });
          if (!res.ok || res.redirected || !arHtml(res)) continue;
          // sidans JS och CSS behövs också för att den ska fungera offline
          const html = await res.clone().text();
          for (const m of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) filer.add(m[0]);
          await cache.put(u, res);
        } catch {
          return; // offline: försök igen nästa gång
        }
      }
      for (const f of filer) {
        if (await statiskt.match(f)) continue;
        try {
          const res = await fetch(f);
          if (res.ok) await statiskt.put(f, res);
        } catch {
          return;
        }
      }
    })(),
  );
});
