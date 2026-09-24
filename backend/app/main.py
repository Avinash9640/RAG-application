from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.chat import router as chat_router
from app.api.conversations import router as conversations_router
from app.api.documents import router as documents_router
from app.api.audit_logs import router as audit_logs_router


app = FastAPI(
    title="RAG Assistant API",
    description="Enterprise RAG Assistant Backend",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# API Routers
# ---------------------------------------------------------

app.include_router(health_router)
app.include_router(chat_router)
app.include_router(conversations_router)
app.include_router(documents_router)
app.include_router(audit_logs_router)


# ---------------------------------------------------------
# Root Endpoint
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": "RAG Assistant Backend",
        "version": "1.0.0",
    }
