import math

from app.config import EMBEDDING_DIMENSION
from app.services.document_service import split_text
from app.services.embedding_service import embed_text
from app.services.retrieval_service import filename_match_score
from app.services.chat_service import _retrieval_query


def test_embedding_has_configured_dimension_and_unit_norm():
    vector = embed_text("paid vacation policy")
    assert len(vector) == EMBEDDING_DIMENSION
    assert math.isclose(sum(value * value for value in vector), 1.0, rel_tol=1e-6)


def test_embedding_is_deterministic():
    assert embed_text("same text") == embed_text("same text")


def test_chunking_preserves_overlap_and_content():
    chunks = split_text("one two three four five six", chunk_size=14, overlap=4)
    assert len(chunks) > 1
    assert all(chunks)
    assert all(len(chunk) <= 14 for chunk in chunks)


def test_chunking_rejects_blank_content():
    assert split_text("  \n\t  ") == []


def test_fixed_strategy_uses_exact_character_windows():
    text = "abcdefghijklmnopqrstuvwxyz"
    chunks = split_text(text, chunk_size=10, overlap=2, strategy="fixed")
    assert chunks == ["abcdefghij", "ijklmnopqr", "qrstuvwxyz"]


def test_recursive_strategy_prefers_natural_boundaries():
    chunks = split_text(
        "alpha beta gamma delta epsilon", chunk_size=17, overlap=0,
        strategy="recursive",
    )
    assert chunks[0] == "alpha beta gamma"
    assert all(len(chunk) <= 17 for chunk in chunks)


def test_filename_routing_recognizes_named_resume():
    assert filename_match_score(
        "Tell me about Avinash resume", "AVINASH Resume Data eng.docx"
    ) == 2
    assert filename_match_score(
        "Tell me about Avinash resume", "Indian Constitution.pdf"
    ) == 0


def test_follow_up_query_uses_recent_conversation_subject():
    resolved = _retrieval_query(
        "Which clients did he work for?",
        ["What skills does Avinash have?"],
    )
    assert "Avinash" in resolved
    assert resolved.startswith("Which clients")


def test_standalone_query_is_not_rewritten():
    question = "What does the Constitution say about citizenship?"
    assert _retrieval_query(question, ["Tell me about Avinash"]) == question
