import re
from collections import defaultdict

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.config import RETRIEVAL_MIN_SCORE, RETRIEVAL_TOP_K
from app.core.demo_auth import CurrentActor
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import embed_text


STOP_WORDS = {
    "about", "are", "document", "find", "for", "from", "give", "how",
    "information", "me", "of", "please", "show", "tell", "the", "this",
    "to", "what", "who", "with",
}


def _terms(value: str) -> set[str]:
    terms = set()
    for term in re.findall(r"[a-z0-9]+", value.lower()):
        if len(term) >= 5 and term.endswith("s") and not term.endswith("ss"):
            term = term[:-1]
        if len(term) >= 3 and term not in STOP_WORDS:
            terms.add(term)
    return terms


def filename_match_score(question: str, filename: str) -> int:
    """Score meaningful query terms found in a document filename."""
    return len(_terms(question) & _terms(filename))


def retrieve_authorized_chunks(
    db: Session,
    actor: CurrentActor,
    question: str,
    limit: int = RETRIEVAL_TOP_K,
) -> list[DocumentChunk]:
    """Authorize scope, route explicit filename queries, then rank with pgvector."""
    authorized_documents = list(db.execute(
        select(Document.id, Document.filename)
        .where(Document.status == "Ready")
        .where(
            or_(
                actor.role == "Admin",
                (
                    Document.allowed_roles.contains([actor.role])
                    & Document.rag_access.is_(True)
                ),
            )
        )
    ).all())
    if not authorized_documents:
        return []

    # A document name is an authorization-safe routing signal. If the user
    # explicitly names a file/person in its filename, search that document
    # instead of allowing a much larger corpus item to monopolize candidates.
    scored_documents = [
        (document_id, filename_match_score(question, filename))
        for document_id, filename in authorized_documents
    ]
    best_filename_score = max(score for _, score in scored_documents)
    if best_filename_score:
        scoped_ids = [
            document_id for document_id, score in scored_documents
            if score == best_filename_score
        ]
        filename_routed = True
        routed_filename_terms = set().union(*(
            _terms(filename) for document_id, filename in authorized_documents
            if document_id in scoped_ids
        ))
    else:
        scoped_ids = [document_id for document_id, _ in authorized_documents]
        filename_routed = False
        routed_filename_terms = set()

    distance = DocumentChunk.embedding.cosine_distance(embed_text(question))
    candidate_limit = max(limit * 10, 50)
    rows = db.execute(
        select(DocumentChunk, distance.label("distance"))
        .options(joinedload(DocumentChunk.document))
        .where(DocumentChunk.document_id.in_(scoped_ids))
        .where(DocumentChunk.embedding.is_not(None))
        .order_by(distance.asc())
        .limit(candidate_limit)
    ).all()

    query_terms = _terms(question) - routed_filename_terms
    if not query_terms:
        query_terms = _terms(question)
    ranked = []
    for chunk, value in rows:
        vector_score = 1.0 - float(value)
        content_terms = _terms(chunk.content)
        lexical_hits = len(query_terms & content_terms)
        hybrid_score = vector_score + min(lexical_hits, 4) * 0.35
        if filename_routed or vector_score >= RETRIEVAL_MIN_SCORE or lexical_hits:
            ranked.append((hybrid_score, chunk))
    ranked.sort(key=lambda item: item[0], reverse=True)

    # Preserve corpus diversity for broad questions. Explicit filename queries
    # are already scoped and may return all top chunks from the named document.
    selected: list[DocumentChunk] = []
    per_document: defaultdict[str, int] = defaultdict(int)
    per_document_limit = limit if filename_routed else max(1, min(2, limit))
    client_question = "client" in _terms(question)
    seen_clients: set[str] = set()
    for _, chunk in ranked:
        if per_document[chunk.document_id] >= per_document_limit:
            continue
        if client_question:
            chunk_clients = {
                name.strip().lower()
                for name in re.findall(
                    r"Client:\s*([^|\n]+?)(?=\s*\||\s+Employer:|\s+Location:|$)",
                    chunk.content,
                    re.IGNORECASE,
                )
            }
            if not chunk_clients or chunk_clients <= seen_clients:
                continue
            seen_clients.update(chunk_clients)
        selected.append(chunk)
        per_document[chunk.document_id] += 1
        if len(selected) == limit:
            break
    return selected
