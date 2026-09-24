"""Create tables and apply additive development-schema migrations."""

import json

from sqlalchemy import text

from app.config import EMBEDDING_DIMENSION, EMBEDDING_MODEL
from app.database import Base, engine
from app.models import AuditLog, Conversation, Document, DocumentChunk, Message  # noqa: F401
from app.services.embedding_service import embed_text


def main():
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(text(
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255)"
        ))
        connection.execute(text(
            "UPDATE conversations SET owner_email = 'anonymous@rag.local' WHERE owner_email IS NULL"
        ))
        connection.execute(text(
            "ALTER TABLE conversations ALTER COLUMN owner_email SET NOT NULL"
        ))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_conversations_owner_email ON conversations (owner_email)"
        ))
        connection.execute(text(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS sources JSONB NOT NULL DEFAULT '[]'::jsonb"
        ))
        connection.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(255)"
        ))
        connection.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS allowed_roles JSONB NOT NULL DEFAULT '[\"User\", \"Admin\"]'::jsonb"
        ))
        connection.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS chunk_strategy VARCHAR(30) NOT NULL DEFAULT 'recursive'"
        ))
        connection.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS chunk_size INTEGER NOT NULL DEFAULT 1000"
        ))
        connection.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS chunk_overlap INTEGER NOT NULL DEFAULT 200"
        ))
        connection.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS rag_access BOOLEAN NOT NULL DEFAULT TRUE"
        ))
        connection.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS allow_view BOOLEAN NOT NULL DEFAULT TRUE"
        ))
        connection.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS allow_download BOOLEAN NOT NULL DEFAULT TRUE"
        ))
        connection.execute(text(
            "UPDATE documents SET uploaded_by = 'anonymous@rag.local' WHERE uploaded_by IS NULL"
        ))
        connection.execute(text(
            "ALTER TABLE documents ALTER COLUMN uploaded_by SET NOT NULL"
        ))
        connection.execute(text(
            "ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb"
        ))
        connection.execute(text(
            f"ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS embedding vector({EMBEDDING_DIMENSION})"
        ))
        actual_vector_type = connection.execute(text(
            "SELECT format_type(a.atttypid, a.atttypmod) "
            "FROM pg_attribute a "
            "JOIN pg_class c ON c.oid = a.attrelid "
            "WHERE c.relname = 'document_chunks' AND a.attname = 'embedding'"
        )).scalar_one()
        expected_vector_type = f"vector({EMBEDDING_DIMENSION})"
        if actual_vector_type != expected_vector_type:
            raise RuntimeError(
                f"Embedding schema mismatch: database uses {actual_vector_type}, "
                f"but {EMBEDDING_MODEL} is configured for {expected_vector_type}. "
                "Re-embed documents with an explicit dimension migration."
            )

        missing = connection.execute(text(
            "SELECT id, content FROM document_chunks WHERE embedding IS NULL"
        )).all()
        for chunk_id, content in missing:
            connection.execute(
                text("UPDATE document_chunks SET embedding = CAST(:embedding AS vector) WHERE id = :id"),
                {"embedding": json.dumps(embed_text(content)), "id": chunk_id},
            )
        connection.execute(text(
            "ALTER TABLE document_chunks ALTER COLUMN embedding SET NOT NULL"
        ))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_document_chunks_embedding_hnsw "
            "ON document_chunks USING hnsw (embedding vector_cosine_ops)"
        ))

    print(
        "Database tables created successfully. "
        f"Embedding model={EMBEDDING_MODEL}, dimension={EMBEDDING_DIMENSION}."
    )


if __name__ == "__main__":
    main()
