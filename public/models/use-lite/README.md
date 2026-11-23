Self-hosted copy of the Universal Sentence Encoder lite TF.js model, used by
the semantic search (`src/searchWorker.ts`) and by `build_search_embeddings.mjs`
to precompute comic embeddings. Both must use these exact files.

Sources:

- `model.json`, `group1-shard*of7`:
  https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1
  (now served from https://www.kaggle.com/models/tensorflow/universal-sentence-encoder/tfJs/lite/1)
- `vocab.json`:
  https://storage.googleapis.com/tfjs-models/savedmodel/universal_sentence_encoder/vocab.json

License: Apache 2.0 (Google).
