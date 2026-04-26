/// <reference lib="webworker" />
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import type {
  MainToWorkerMessage,
  WorkerToMainMessage,
  VectorSearchHit,
} from "./searchWorkerMessages";

type EmbeddingsFile = {
  model: string;
  dim: number;
  ids: string[];
  vectors: number[][];
};

let embeddingMatrix: Float32Array | null = null;
let embeddingMagnitudes: Float32Array | null = null;
let embeddingIds: string[] = [];
let embeddingDim = 0;
let model: use.UniversalSentenceEncoder | null = null;

function post(msg: WorkerToMainMessage) {
  (self as DedicatedWorkerGlobalScope).postMessage(msg);
}

async function loadEmbeddings(): Promise<void> {
  // Vite handles this as a lazy chunk; only fetched once the worker runs.
  const data: EmbeddingsFile = (
    await import("./searchEmbeddings.json")
  ).default as EmbeddingsFile;

  embeddingDim = data.dim;
  embeddingIds = data.ids;
  const n = data.vectors.length;
  const flat = new Float32Array(n * data.dim);
  const mags = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = data.vectors[i];
    let sumSq = 0;
    const base = i * data.dim;
    for (let j = 0; j < data.dim; j++) {
      const x = v[j];
      flat[base + j] = x;
      sumSq += x * x;
    }
    mags[i] = Math.sqrt(sumSq) || 1;
  }
  embeddingMatrix = flat;
  embeddingMagnitudes = mags;
}

async function ensureModel(): Promise<use.UniversalSentenceEncoder> {
  if (model) return model;
  await tf.ready();
  model = await use.load();
  return model;
}

async function embedQuery(query: string, topK: number, requestId: number) {
  if (!model || !embeddingMatrix || !embeddingMagnitudes) {
    post({ type: "error", requestId, error: "Worker not initialized" });
    return;
  }
  if (!query.trim()) {
    post({ type: "results", requestId, hits: [] });
    return;
  }

  const embeddings = await model.embed([query]);
  const queryVec = await embeddings.data();
  embeddings.dispose();

  let qMag = 0;
  for (let j = 0; j < embeddingDim; j++) qMag += queryVec[j] * queryVec[j];
  qMag = Math.sqrt(qMag) || 1;

  const n = embeddingIds.length;
  const scores = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const base = i * embeddingDim;
    let dot = 0;
    for (let j = 0; j < embeddingDim; j++) {
      dot += queryVec[j] * embeddingMatrix[base + j];
    }
    scores[i] = dot / (qMag * embeddingMagnitudes[i]);
  }

  // Top-K via partial sort.
  const indices = Array.from({ length: n }, (_, i) => i);
  indices.sort((a, b) => scores[b] - scores[a]);
  const hits: VectorSearchHit[] = indices.slice(0, topK).map((i) => ({
    id: embeddingIds[i],
    score: scores[i],
  }));

  post({ type: "results", requestId, hits });
}

async function main() {
  try {
    await Promise.all([ensureModel(), loadEmbeddings()]);
    post({ type: "ready" });
  } catch (e) {
    post({
      type: "error",
      requestId: -1,
      error: e instanceof Error ? e.message : String(e),
    });
    return;
  }

  self.onmessage = async (event: MessageEvent<MainToWorkerMessage>) => {
    const message = event.data;
    if (message.type === "search") {
      try {
        await embedQuery(message.query, message.topK, message.requestId);
      } catch (e) {
        post({
          type: "error",
          requestId: message.requestId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  };
}

main();
