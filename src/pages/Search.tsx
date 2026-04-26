import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { searchIndex, type SearchEntry } from "../searchIndex";
import { strips } from "../strips";

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

  const fuse = useMemo(
    () =>
      new Fuse<SearchEntry>(searchIndex, {
        keys: [
          { name: "title", weight: 2 },
          { name: "blog", weight: 1 },
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
  const results = useMemo(() => {
    if (trimmedQuery.length < 2) return [];
    return fuse.search(trimmedQuery).slice(0, 100);
  }, [fuse, trimmedQuery]);

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
        <p>Type to search through comic titles and blog text.</p>
      ) : trimmedQuery.length < 2 ? (
        <p>Type at least 2 characters.</p>
      ) : results.length === 0 ? (
        <p>No results for &ldquo;{trimmedQuery}&rdquo;.</p>
      ) : (
        <ul className="search-results">
          {results.map(({ item }) => {
            const strip = strips[item.id];
            const imgUrl = strip?.image_url ?? null;
            return (
              <li key={item.id} className="search-result">
                <Link to={`/${item.id}`}>
                  {imgUrl ? (
                    <img
                      className="search-result-thumb"
                      src={imgUrl}
                      alt={strip?.image_alt ?? ""}
                    />
                  ) : null}
                  <span className="search-result-title">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Search;
