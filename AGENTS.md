# AGENTS.md

## Project Overview

This is a recreation of abstrusegoose.com (a now-defunct webcomic), hosted at
**abstrusegoose.xyz**. The original site's pages were downloaded from the
Internet Archive's Wayback Machine, parsed to extract comic data, and rebuilt as
a React single-page application.

All comic content is by the original author; this project is a fan-maintained
mirror to keep the strips accessible.

## Architecture

### Frontend (React + Vite + TypeScript)

- **Entry point:** `src/main.tsx` -- sets up React Router with `BrowserRouter`.
- **Layout:** `src/Layout.tsx` -- shared header/footer shell, renders child
  routes via `<Outlet />`.
- **Pages:** `src/pages/` -- one component per route (Home, Archive,
  ComicStrip, About, Faq, etc.). The catch-all `*` route renders `ComicStrip`.
- **Comic data:** `src/strips.json` is the generated data file containing all
  comic metadata (title, image URL, alt text, blog text, navigation IDs, etc.).
  It is typed and re-exported by `src/strips.ts`.
- **Static assets:** `public/strips/` has the comic images, `public/images/`
  has site images (logo, etc.), and `public/doublesecretarchives/` has hidden
  archive content.
- **Styling:** `src/index.css` -- single global stylesheet.
- **Config:** `vite.config.ts` -- Vite config with `base` set to
  `https://abstrusegoose.xyz/`.

### Python tooling (uv + BeautifulSoup)

Two standalone Python scripts live in the project root. They are managed via
`uv` (see `pyproject.toml`). They are not part of the deployed site; they are
offline data-pipeline tools.

- **`wayback_mirror.py`** -- Resumable crawler that downloads pages from the
  Wayback Machine into `raw/`. Stores state in `raw/.download_state.json`.
- **`parse_page.py`** -- Parses the downloaded HTML files under
  `raw/abstrusegoose.com/` and emits `src/strips.json`. Run via
  `pnpm parse-pages`.
- **`build_search_index.py`** -- Reads `src/strips.json`, OCRs each comic
  image (via `pytesseract` / system `tesseract`), and emits
  `src/searchIndex.json` (titles + plain-text blog content + OCR'd
  in-comic text) for the client-side fuzzy search. OCR results are cached
  in `.ocr_cache.json` (keyed by image path + mtime) so reruns are cheap.
  Run via `pnpm build-search-index`.

### Deployment

- GitHub Pages, deployed automatically on push to `main` via
  `.github/workflows/deploy.yml`.
- Build: `pnpm install && pnpm run build` (runs `tsc -b && vite build`),
  output in `dist/`.
- Custom domain configured via `public/CNAME`.
- `public/404.html` handles SPA routing for GitHub Pages.

## Key Directories

| Path | Purpose |
|---|---|
| `src/` | React app source |
| `src/pages/` | Page components (one per route) |
| `src/strips.json` | Generated comic data (do not edit by hand) |
| `src/searchIndex.json` | Generated client-side fuzzy-search index (do not edit by hand) |
| `public/strips/` | Comic strip images |
| `public/images/` | Site images (logo, etc.) |
| `raw/` | Downloaded Wayback Machine pages (not deployed) |
| `dist/` | Build output (git-ignored) |

## Development Commands

```sh
pnpm install          # install dependencies
pnpm dev              # start Vite dev server
pnpm build            # type-check + production build
pnpm lint             # run ESLint
pnpm preview          # preview production build locally
pnpm parse-pages      # regenerate src/strips.json from raw HTML
pnpm build-search-index  # regenerate src/searchIndex.json from src/strips.json
```

## Data Pipeline

To update comic data:

1. Run `wayback_mirror.py` to download/update raw pages into `raw/`.
2. Run `pnpm parse-pages` to regenerate `src/strips.json`.
3. Comic images live in `public/strips/` (copied from `raw/` manually).

`src/strips.json` is the single source of truth for the frontend. Each entry is
keyed by strip ID (numeric for regular comics, path-like for secret archives)
and contains: `title`, `image_title`, `image_url`, `image_anchor`, `image_alt`,
`image_width`, `image_height`, `previous_id`, `next_id`, `blog_text`.

## Conventions

- Package manager: **pnpm**
- Python tooling: **uv** (dependencies in `pyproject.toml`)
- All URLs use `https://` (http links are converted during parsing).
- Links to defunct external sites are replaced with Internet Archive URLs.
- The "store" link from the original is replaced with a GitHub "report an
  issue" link.
- The "privacy" page is replaced with "about this mirror".
- Licensed under Creative Commons Attribution-Noncommercial 3.0 United States.
