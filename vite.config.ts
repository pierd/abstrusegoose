import { createHash } from 'node:crypto'
import { readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Public dirs whose files make up the "download for offline reading" content.
// Games (sa-games, sa-comics), the search model and videos are deliberately
// left out: they're big and not needed to read the comics.
const OFFLINE_CONTENT_DIRS = ['strips', 'doublesecretarchives', 'how_stuff_works']

// Cache holding the offline content. Not versioned per build, so downloaded
// comics survive app updates. Shared with the app and the service worker via
// `define` (the service worker can't import shared modules).
const CONTENT_CACHE = 'ag-content-v1'

// Public files the app shell needs (layout images, icons, manifest).
const SHELL_PUBLIC_FILES = [
  '/manifest.webmanifest',
  '/images/AGlogo.PNG',
  '/images/designation.PNG',
  '/images/favicon.ico',
  '/images/somerights20.png',
  '/images/feed_the_goose.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (name.startsWith('.') || name === 'README.md') return []
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

// Builds src/sw.ts as /sw.js and injects:
//   - the list of files to precache as the app shell (all build output except
//     the semantic-search worker, which embeds ~3.7 MB of vectors), and
//   - a build id used to version the shell cache.
// Also emits /offline-manifest.json listing the offline content with sizes.
function serviceWorker(): Plugin {
  return {
    name: 'abstrusegoose-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const sw = bundle['sw.js']
      if (!sw || sw.type !== 'chunk') this.error('sw.js chunk missing')

      const content = OFFLINE_CONTENT_DIRS.flatMap((dir) =>
        listFiles(join('public', dir)).map((path) => ({
          url: '/' + relative('public', path).split(sep).join('/'),
          size: statSync(path).size,
        })),
      )
      this.emitFile({
        type: 'asset',
        fileName: 'offline-manifest.json',
        source: JSON.stringify({ files: content }),
      })

      // index.html is emitted after this hook runs, so it's added explicitly
      // (as "/", the URL the service worker serves for every app route).
      const built = Object.keys(bundle)
        .filter((f) => f.startsWith('assets/') && !/^assets\/searchWorker-/.test(f))
        .map((f) => '/' + f)
      const precache = ['/', ...built, ...SHELL_PUBLIC_FILES, '/offline-manifest.json']
      const buildId = createHash('sha256')
        .update(precache.join('\n'))
        .digest('hex')
        .slice(0, 12)

      // The build id is plain hex, so it can replace the token even where the
      // minifier folded it into another string ("ag-shell-__AG_BUILD_ID__").
      const code = sw.code
        .replace(/(["'`])__AG_PRECACHE__\1/, JSON.stringify(precache))
        .replaceAll('__AG_BUILD_ID__', buildId)
      const leftover = code.indexOf('__AG_')
      if (leftover !== -1) {
        this.error(
          `sw.js placeholders not replaced: ...${code.slice(leftover - 60, leftover + 60)}...`,
        )
      }
      sw.code = code
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), serviceWorker()],
  define: {
    __AG_CONTENT_CACHE__: JSON.stringify(CONTENT_CACHE),
    __AG_CONTENT_PREFIXES__: JSON.stringify(OFFLINE_CONTENT_DIRS.map((d) => `/${d}/`)),
  },
  base: 'https://abstrusegoose.xyz/',
  build: {
    rolldownOptions: {
      input: { index: 'index.html', sw: 'src/sw.ts' },
      output: {
        // The service worker must live at the site root (its scope) under a
        // stable name; everything else keeps hashed names.
        entryFileNames: (chunk) =>
          chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js',
      },
    },
  },
})
