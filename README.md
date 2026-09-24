# Enterprise RAG Assistant

This project is a React + FastAPI enterprise RAG application backed by
PostgreSQL and pgvector. It persists conversations and messages, accepts
admin-only PDF/DOCX/TXT uploads, extracts and chunks text, stores one chunk per
database row, generates 384-dimensional embeddings, performs authorization
before vector retrieval, and returns grounded answers with page citations.

## Run locally

1. Copy `backend/.env.example` values into `backend/.env` and set the database
   password. PostgreSQL and the `vector` extension must already be available.
2. From `backend`, install dependencies with
   `python -m pip install -r requirements.txt`.
3. Apply the additive schema setup with `python create_tables.py`.
4. Start the API with `python -m uvicorn app.main:app --reload`.
5. From `frontend`, run `npm install` and `npm run dev`.

The default `local-hash-v1` embedding model is deterministic and offline. Its
declared output is exactly 384 dimensions, matching `vector(384)`. A hosted
OpenAI-compatible embeddings endpoint can be selected with `EMBEDDING_API_URL`,
`EMBEDDING_API_KEY`, and `EMBEDDING_MODEL`; its real output size must equal
`EMBEDDING_DIMENSION`. Changing the model or dimension requires a deliberate
embedding migration and reprocessing all documents.

By default, answers are extractive and cited, so the complete RAG pipeline works
without external credentials. To use a generative model, configure an
OpenAI-compatible chat-completions URL, model name, and optional API key using
the `LLM_*` variables in `.env.example`. If that endpoint is unavailable or
returns an invalid response, the service safely falls back to extractive output.

## Authorization boundary

The current login is explicitly a demo identity boundary. Conversation access
is owner-scoped. Document upload, listing, deletion, and reprocessing are
admin-only. Retrieval first builds an authorized document set and only then
runs pgvector similarity search. Replace demo headers with validated identity
provider claims and durable RBAC/ACL data before production deployment.

Document access uses three independent PostgreSQL-backed permissions:
`rag_access`, `allow_view`, and `allow_download`. Normal-user vector retrieval
requires RAG access; original-file view and download endpoints enforce their
own flags and write allowed/denied events to `audit_logs`. Admins can change
these flags from Documents and review events under Access audit. This role-level
model intentionally keeps the permission checks separate so it can later be
replaced by a `document_permissions` table for user/group principals without
changing the retrieval or file-serving boundaries.
