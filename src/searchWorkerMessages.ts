export type MainToWorkerMessage = {
  type: "search";
  requestId: number;
  query: string;
  topK: number;
};

export type VectorSearchHit = {
  id: string;
  score: number;
};

export type WorkerToMainMessage =
  | { type: "ready" }
  | { type: "results"; requestId: number; hits: VectorSearchHit[] }
  | { type: "error"; requestId: number; error: string };
