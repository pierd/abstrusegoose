import { lazy } from "react";

// Search page pulls in the (large) static search index + Fuse.js, so split
// it into its own chunk and load it on demand.
const Search = lazy(() => import("./Search.tsx"));

export default Search;
