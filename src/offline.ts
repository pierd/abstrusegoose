// Same cache the service worker uses (defined in vite.config.ts).
const CONTENT_CACHE = __AG_CONTENT_CACHE__;

// Generated at build time by the plugin in vite.config.ts.
type OfflineManifest = { files: { url: string; size: number }[] };

export type OfflineStatus = {
  totalFiles: number;
  totalBytes: number;
  cachedFiles: number;
  cachedBytes: number;
};

export const offlineSupported =
  typeof window !== "undefined" && "caches" in window && "serviceWorker" in navigator;

async function loadManifest(): Promise<OfflineManifest> {
  const res = await fetch("/offline-manifest.json");
  if (!res.ok) throw new Error(`offline manifest: HTTP ${res.status}`);
  return res.json();
}

function pathOf(request: Request) {
  return new URL(request.url).pathname;
}

export async function getOfflineStatus(): Promise<OfflineStatus> {
  const manifest = await loadManifest();
  const cache = await caches.open(CONTENT_CACHE);
  const cached = new Set((await cache.keys()).map(pathOf));
  let cachedFiles = 0;
  let cachedBytes = 0;
  let totalBytes = 0;
  for (const f of manifest.files) {
    totalBytes += f.size;
    if (cached.has(f.url)) {
      cachedFiles++;
      cachedBytes += f.size;
    }
  }
  return { totalFiles: manifest.files.length, totalBytes, cachedFiles, cachedBytes };
}

// Downloads every missing offline file into the content cache, a few at a
// time, reporting progress. Resumable: already cached files are skipped.
export async function downloadForOffline(
  onProgress: (status: OfflineStatus, failed: number) => void,
  signal: AbortSignal,
): Promise<{ failed: number }> {
  // Ask the browser not to evict the content under storage pressure.
  await navigator.storage?.persist?.().catch(() => false);

  const manifest = await loadManifest();
  const cache = await caches.open(CONTENT_CACHE);
  const cached = new Set((await cache.keys()).map(pathOf));
  const status: OfflineStatus = {
    totalFiles: manifest.files.length,
    totalBytes: manifest.files.reduce((sum, f) => sum + f.size, 0),
    cachedFiles: 0,
    cachedBytes: 0,
  };
  const todo = manifest.files.filter((f) => {
    if (!cached.has(f.url)) return true;
    status.cachedFiles++;
    status.cachedBytes += f.size;
    return false;
  });
  let failed = 0;
  onProgress({ ...status }, failed);

  const queue = [...todo];
  const worker = async () => {
    for (let f = queue.shift(); f && !signal.aborted; f = queue.shift()) {
      try {
        const res = await fetch(f.url, { signal });
        // Skip anything that isn't the real file (e.g. a captive portal).
        if (!res.ok || res.redirected) throw new Error(`HTTP ${res.status}`);
        await cache.put(f.url, res);
        status.cachedFiles++;
        status.cachedBytes += f.size;
      } catch {
        if (signal.aborted) return;
        failed++;
      }
      onProgress({ ...status }, failed);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return { failed };
}

export async function removeOfflineContent() {
  await caches.delete(CONTENT_CACHE);
}

export function formatBytes(bytes: number) {
  return `${(bytes / 2 ** 20).toFixed(1)} MB`;
}
