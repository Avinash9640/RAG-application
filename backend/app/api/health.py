from fastapi import APIRouter

from app.config import EMBEDDING_DIMENSION, EMBEDDING_MODEL, LLM_API_URL, LLM_MODEL


router = APIRouter(
    prefix="/api",
    tags=["Health"],
)


@router.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "RAG Assistant Backend",
        "embedding_model": EMBEDDING_MODEL,
        "embedding_dimension": EMBEDDING_DIMENSION,
        "answer_mode": "llm" if LLM_API_URL and LLM_MODEL else "extractive",
    }
