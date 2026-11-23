// Generate src/searchEmbeddings.json from src/searchIndex.json.
//
// Uses the exact same model files (public/models/use-lite/) and the same JS
// package (@tensorflow-models/universal-sentence-encoder) as the browser search
// worker, so comic vectors and query vectors live in the same space.
//
// The model files are served from a throwaway local HTTP server so they are
// loaded through the same code path as in the browser.
//
// Embeddings are cached in .embedding_cache.json keyed by sha256 of the input
// text; the cache is discarded if it was built with a different model.
//
// Run via `pnpm build-search-embeddings`.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import * as use from "@tensorflow-models/universal-sentence-encoder";

const MODEL_ID = "universal-sentence-encoder-lite/1";
const MODEL_DIR = "public/models/use-lite";
const INDEX_PATH = "src/searchIndex.json";
const EMBEDDINGS_PATH = "src/searchEmbeddings.json";
const CACHE_PATH = ".embedding_cache.json";
const EMBED_MAX_CHARS = 4000; // truncate per-entry text fed to the encoder
const BATCH_SIZE = 16;
const PRECISION = 1e5; // round stored components to 5 decimals (keeps the JSON small)

function embedTextForEntry(entry) {
  return [entry.title, entry.blog, entry.ocr, entry.image_alt, entry.image_title]
    .filter((p) => p)
    .join(" \n\n ")
    .slice(0, EMBED_MAX_CHARS);
}

const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");

function loadCache() {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    const data = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
    return data.model === MODEL_ID ? data.entries : {};
  } catch {
    return {};
  }
}

function saveCache(entries) {
  writeFileSync(CACHE_PATH, JSON.stringify({ model: MODEL_ID, entries }));
}

function serveModelDir() {
  const types = { ".json": "application/json" };
  const server = createServer((req, res) => {
    const name = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
    const path = join(MODEL_DIR, name);
    if (!path.startsWith(MODEL_DIR) || !existsSync(path)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[extname(path)] ?? "application/octet-stream",
    });
    res.end(readFileSync(path));
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve(server)),
  );
}

async function main() {
  const entries = JSON.parse(readFileSync(INDEX_PATH, "utf8"));

  const server = await serveModelDir();
  const base = `http://127.0.0.1:${server.address().port}`;
  await tf.setBackend("cpu");
  const model = await use.load({
    modelUrl: `${base}/model.json`,
    vocabUrl: `${base}/vocab.json`,
  });
  server.close();
  console.error(`Loaded ${MODEL_ID}.`);

  const cache = loadCache();
  const newCache = {};
  const vectors = new Array(entries.length);
  let dim = 0;
  let computed = 0;
  let reused = 0;

  const pending = []; // { index, text, hash }
  const flush = async () => {
    if (pending.length === 0) return;
    const tensor = await model.embed(pending.map((p) => p.text));
    const rows = await tensor.array();
    tensor.dispose();
    pending.forEach((p, k) => {
      vectors[p.index] = rows[k];
      newCache[p.hash] = rows[k];
    });
    computed += pending.length;
    pending.length = 0;
    console.error(`  embed ${computed + reused}/${entries.length}`);
    saveCache({ ...cache, ...newCache });
  };

  for (let i = 0; i < entries.length; i++) {
    const text = embedTextForEntry(entries[i]);
    if (!text.trim()) continue; // filled with zeros below
    const hash = sha256(text);
    if (cache[hash]) {
      vectors[i] = cache[hash];
      newCache[hash] = cache[hash];
      reused++;
      continue;
    }
    pending.push({ index: i, text, hash });
    if (pending.length >= BATCH_SIZE) await flush();
  }
  await flush();
  saveCache(newCache); // drops entries for texts that no longer exist

  dim = vectors.find((v) => v)?.length ?? 512;
  const out = {
    model: MODEL_ID,
    dim,
    ids: entries.map((e) => e.id),
    vectors: vectors.map((v) =>
      v ? v.map((x) => Math.round(x * PRECISION) / PRECISION) : new Array(dim).fill(0),
    ),
  };
  writeFileSync(EMBEDDINGS_PATH, JSON.stringify(out) + "\n");
  console.error(
    `Wrote ${out.ids.length} embeddings to ${EMBEDDINGS_PATH} (computed=${computed}, reused=${reused}).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
