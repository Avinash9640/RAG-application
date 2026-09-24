import hashlib
import math
import re

import httpx

from app.config import (
    EMBEDDING_API_KEY,
    EMBEDDING_API_URL,
    EMBEDDING_DIMENSION,
    EMBEDDING_MODEL,
    EMBEDDING_TIMEOUT_SECONDS,
)


def _feature_index(feature: str) -> tuple[int, float]:
    digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest()
    value = int.from_bytes(digest, "big")
    return value % EMBEDDING_DIMENSION, 1.0 if value & 1 else -1.0


def embed_text(text: str) -> list[float]:
    """Return a deterministic local embedding with a declared dimension.

    local-hash-v1 combines word and character-trigram features. It keeps the
    project operational without network credentials and can be replaced by a
    hosted embedding provider as long as EMBEDDING_DIMENSION matches.
    """
    return embed_texts([text])[0]


def _local_embedding(text: str) -> list[float]:

    vector = [0.0] * EMBEDDING_DIMENSION
    words = re.findall(r"[a-z0-9]+", text.lower())
    features = [f"w:{word}" for word in words]
    features.extend(
        f"c:{word[index:index + 3]}"
        for word in words
        for index in range(max(0, len(word) - 2))
    )
    for feature in features:
        index, sign = _feature_index(feature)
        vector[index] += sign

    norm = math.sqrt(sum(value * value for value in vector))
    if not norm:
        return vector
    return [value / norm for value in vector]


def embed_texts(texts: list[str]) -> list[list[float]]:
    if EMBEDDING_MODEL == "local-hash-v1":
        return [_local_embedding(text) for text in texts]
    if not EMBEDDING_API_URL:
        raise RuntimeError(
            "EMBEDDING_API_URL is required for a non-local embedding model."
        )
    headers = {"Content-Type": "application/json"}
    if EMBEDDING_API_KEY:
        headers["Authorization"] = f"Bearer {EMBEDDING_API_KEY}"
    response = httpx.post(
        EMBEDDING_API_URL,
        headers=headers,
        json={"model": EMBEDDING_MODEL, "input": texts},
        timeout=EMBEDDING_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    rows = sorted(response.json()["data"], key=lambda row: row["index"])
    vectors = [row["embedding"] for row in rows]
    if len(vectors) != len(texts):
        raise RuntimeError("Embedding provider returned an unexpected result count.")
    if any(len(vector) != EMBEDDING_DIMENSION for vector in vectors):
        raise RuntimeError(
            f"Embedding provider output does not match vector({EMBEDDING_DIMENSION})."
        )
    return vectors
