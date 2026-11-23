import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Remembers the last page viewed so the installed app (whose start_url is
// "/?resume", see public/manifest.webmanifest) reopens where the reader left
// off. Plain visits to "/" still show the latest strip.

const STORAGE_KEY = "abstrusegoose:lastPage";
const RESUME_PARAM = "resume";
const NOT_REMEMBERED = new Set(["/random"]);

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// Call before the router renders: turns "/?resume" into the saved page.
export function resumeLastPage() {
  const params = new URLSearchParams(window.location.search);
  if (window.location.pathname !== "/" || !params.has(RESUME_PARAM)) return;
  const saved = read();
  const target = saved && saved.startsWith("/") && !saved.startsWith("//") ? saved : "/";
  window.history.replaceState(null, "", target);
}

export function useRememberPage() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (NOT_REMEMBERED.has(pathname)) return;
    try {
      localStorage.setItem(STORAGE_KEY, pathname + search);
    } catch {
      // Storage unavailable (private mode etc.): nothing to remember.
    }
  }, [pathname, search]);
}
