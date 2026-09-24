from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.demo_auth import CurrentActor, get_current_actor
from app.database import get_db
from app.schemas.chat import ChatRegenerateRequest, ChatRequest, ChatResponse
from app.services.chat_service import process_chat, regenerate_chat


router = APIRouter(
    prefix="/api",
    tags=["Chat"],
)


@router.post(
    "/chat",
    response_model=ChatResponse,
)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    actor: CurrentActor = Depends(get_current_actor),
):
    return process_chat(request, db, actor)


@router.post("/chat/regenerate", response_model=ChatResponse)
def regenerate(
    request: ChatRegenerateRequest,
    db: Session = Depends(get_db),
    actor: CurrentActor = Depends(get_current_actor),
):
    return regenerate_chat(request.conversation_id, db, actor)
