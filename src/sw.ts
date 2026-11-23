/// <reference lib="webworker" />
// Service worker: makes the site installable and readable offline.
//
// - App shell (HTML, JS, CSS, layout images, icons) is precached on install and
//   served cache-first, so the app opens without a network (and isn't replaced
//   by a captive-portal page on flaky wifi). Shell caches are versioned per
//   build; a new build installs a new shell cache and drops the old one.
// - Comic images etc. live in CONTENT_CACHE, filled by the "offline reading"
//   page (src/offline.ts) and opportunistically when viewed online. It is not
//   versioned, so it survives app updates.
//
// Built to /sw.js by the plugin in vite.config.ts, which replaces the
// placeholders below.

// No imports: a classic service worker can't load shared chunks.

const sw = self as unknown as ServiceWorkerGlobalScope;

const PRECACHE = "__AG_PRECACHE__" as unknown as string[];
const BUILD_ID = "__AG_BUILD_ID__" as string;
const SHELL_CACHE = `ag-shell-${BUILD_ID}`;
const SHELL_PREFIX = "ag-shell-";
const CONTENT_CACHE = __AG_CONTENT_CACHE__;

function isContentPath(pathname: string) {
  return __AG_CONTENT_PREFIXES__.some((prefix) => pathname.startsWith(prefix));
}

sw.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // cache: "reload" bypasses the HTTP cache so a new build never
      // precaches a stale index.html.
      await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" })));
      await sw.skipWaiting();
    })(),
  );
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(SHELL_PREFIX) && key !== SHELL_CACHE) {
          await caches.delete(key);
        }
      }
      await sw.clients.claim();
    })(),
  );
});

// App routes ("/", "/576", "/secretarchives/psa", "/archive", ...) have no
// file extension; real files (.htm pages, images, scripts) do.
function isAppRoute(pathname: string) {
  return !/\.[A-Za-z0-9]+$/.test(pathname);
}

// Shown for standalone pages that aren't cached. Inside an iframe (games,
// interactive comics) a "back" link would navigate the frame, so omit it.
function offlinePage(inFrame: boolean) {
  const back = inFrame ? "" : ' <a href="/">Back to the comics</a>.';
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Offline</title>
<p style="font-family:sans-serif;padding:1em">This page isn't available offline.${back}</p>`,
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

// Only keep real, same-origin, non-redirected successes (a captive portal's
// login page must not end up cached as a comic).
function cacheable(res: Response) {
  return res.ok && res.type === "basic" && !res.redirected;
}

async function handleNavigation(request: Request, url: URL): Promise<Response> {
  if (isAppRoute(url.pathname)) {
    const shell = await caches.match("/", { cacheName: SHELL_CACHE });
    if (shell) return shell;
    return fetch(request);
  }
  // Standalone pages (e.g. /how_stuff_works/*.htm, the embedded games).
  try {
    return await fetch(request);
  } catch {
    return (await caches.match(request)) ?? offlinePage(request.destination === "iframe");
  }
}

async function handleResource(request: Request, url: URL): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isContentPath(url.pathname) && cacheable(response)) {
    const cache = await caches.open(CONTENT_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

sw.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== sw.location.origin) return;
  // Range requests (audio in the games) go straight to the network.
  if (request.headers.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request, url));
  } else {
    event.respondWith(handleResource(request, url));
  }
});
