import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { searchIndex, type SearchEntry } from "../searchIndex";
import { strips } from "../strips";
import type {
  VectorSearchHit,
  WorkerToMainMessage,
} from "../searchWorkerMessages";

type WorkerStatus = "loading" | "ready" | "error";

function ResultList({ items }: { items: { id: string; entry?: SearchEntry }[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="search-results">
      {items.map(({ id, entry }) => {
        const strip = strips[id];
        const imgUrl = strip?.image_url ?? null;
        const title = entry?.title ?? strip?.title ?? strip?.image_alt ?? id;
        return (
          <li key={id} className="search-result">
            <Link to={`/${id}`}>
              {imgUrl ? (
                <img
                  className="search-result-thumb"
                  src={imgUrl}
                  alt={strip?.image_alt ?? ""}
                />
              ) : null}
              <span className="search-result-title">{title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);

  // Debounce input -> query (and URL).
  useEffect(() => {
    const handle = setTimeout(() => {
      setQuery(input);
      const trimmed = input.trim();
      setSearchParams(
        trimmed.length > 0 ? { q: trimmed } : {},
        { replace: true },
      );
    }, 150);
    return () => clearTimeout(handle);
  }, [input, setSearchParams]);

  // --------------------------- Fuzzy (Fuse.js) --------------------------- //
  const entriesById = useMemo(() => {
    const map: Record<string, SearchEntry> = {};
    for (const e of searchIndex) map[e.id] = e;
    return map;
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse<SearchEntry>(searchIndex, {
        keys: [
          { name: "title", weight: 2 },
          { name: "blog", weight: 1 },
          { name: "ocr", weight: 1 },
          { name: "image_alt", weight: 1 },
          { name: "image_title", weight: 1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [],
  );

  const trimmedQuery = query.trim();
  const fuzzyResults = useMemo(() => {
    if (trimmedQuery.length < 2) return [];
    return fuse.search(trimmedQuery).slice(0, 50);
  }, [fuse, trimmedQuery]);

  // --------------------------- Vector (worker) --------------------------- //
  const workerRef = useRef<Worker | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>("loading");
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [vectorHits, setVectorHits] = useState<{
    query: string;
    hits: VectorSearchHit[];
  }>({ query: "", hits: [] });
  const requestIdRef = useRef(0);
  const requestQueriesRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    const worker = new Worker(
      new URL("../searchWorker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      const msg = event.data;
      switch (msg.type) {
        case "ready":
          setWorkerStatus("ready");
          break;
        case "error":
          setWorkerError(msg.error);
          if (msg.requestId === -1) setWorkerStatus("error");
          requestQueriesRef.current.delete(msg.requestId);
          break;
        case "results": {
          const q = requestQueriesRef.current.get(msg.requestId);
          requestQueriesRef.current.delete(msg.requestId);
          if (q !== undefined && msg.requestId === requestIdRef.current) {
            setVectorHits({ query: q, hits: msg.hits });
          }
          break;
        }
      }
    };

    worker.onerror = (e) => {
      console.error("Search worker error:", e);
      setWorkerStatus("error");
      setWorkerError(e.message || "Worker error");
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Trigger vector search whenever query / worker readiness change.
  // We don't setState in this effect; instead, we derive `vectorPending`
  // from comparing the current query to the last query we have results for.
  useEffect(() => {
    if (workerStatus !== "ready" || !workerRef.current) return;
    if (trimmedQuery.length < 2) return;
    const requestId = ++requestIdRef.current;
    requestQueriesRef.current.set(requestId, trimmedQuery);
    workerRef.current.postMessage({
      type: "search",
      requestId,
      query: trimmedQuery,
      topK: 20,
    });
  }, [trimmedQuery, workerStatus]);

  // ----------------------------- Rendering ------------------------------- //
  const fuzzyIds = useMemo(
    () => new Set(fuzzyResults.map((r) => r.item.id)),
    [fuzzyResults],
  );

  // Filter vector hits to: (a) decent similarity, (b) not already shown
  // in fuzzy results, (c) for the current query (results from a previous
  // query are dropped).
  const VECTOR_MIN_SCORE = 0.3;
  const vectorOnly = useMemo(() => {
    if (vectorHits.query !== trimmedQuery) return [];
    return vectorHits.hits
      .filter((h) => h.score >= VECTOR_MIN_SCORE && !fuzzyIds.has(h.id))
      .slice(0, 15);
  }, [vectorHits, fuzzyIds, trimmedQuery]);

  const vectorPending =
    workerStatus === "ready" &&
    trimmedQuery.length >= 2 &&
    vectorHits.query !== trimmedQuery;

  return (
    <div id="pages_container">
      <title>Abstruse Goose | SEARCH</title>
      <h1 className="storytitle">
        <Link to="/search">SEARCH</Link>
      </h1>
      <br />
      <p>
        <input
          type="search"
          className="search-input"
          placeholder="Search comics..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
      </p>

      {trimmedQuery.length === 0 ? (
        <p>Type to search through comic titles, blog text, and in-comic text.</p>
      ) : trimmedQuery.length < 2 ? (
        <p>Type at least 2 characters.</p>
      ) : (
        <>
          {fuzzyResults.length > 0 ? (
            <>
              <h2 className="search-section-heading">Text matches</h2>
              <ResultList
                items={fuzzyResults.map((r) => ({
                  id: r.item.id,
                  entry: r.item,
                }))}
              />
            </>
          ) : (
            <p>No text matches for &ldquo;{trimmedQuery}&rdquo;.</p>
          )}

          <h2 className="search-section-heading">
            Semantic matches
            {workerStatus === "loading" && (
              <span className="search-status"> (loading model...)</span>
            )}
            {workerStatus === "ready" && vectorPending && (
              <span className="search-status"> (searching...)</span>
            )}
            {workerStatus === "error" && (
              <span className="search-status">
                {" "}(unavailable: {workerError})
              </span>
            )}
          </h2>
          {workerStatus === "ready" && !vectorPending && vectorOnly.length === 0 ? (
            <p>No additional semantic matches.</p>
          ) : (
            <ResultList
              items={vectorOnly.map((h) => ({
                id: h.id,
                entry: entriesById[h.id],
              }))}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Search;
