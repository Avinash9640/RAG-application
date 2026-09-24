from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.demo_auth import CurrentActor, get_current_actor
from app.database import get_db
from app.models.conversation import Conversation
from app.models.document import Document
from app.schemas.conversation import (
    ConversationCreate,
    ConversationMessage,
    ConversationMessagesResponse,
    ConversationResponse,
)


router = APIRouter(
    prefix="/api/conversations",
    tags=["Conversations"],
)


def serialize_conversation(conversation: Conversation) -> ConversationResponse:
    last_message = conversation.messages[-1] if conversation.messages else None
    preview = last_message.content.strip() if last_message else None
    if preview and len(preview) > 120:
        preview = preview[:117].rstrip() + "..."
    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        preview=preview,
        message_count=len(conversation.messages),
    )


# ---------------------------------------------------------
# Create conversation
# ---------------------------------------------------------

@router.post(
    "",
    response_model=ConversationResponse,
)
def create_conversation(
    request: ConversationCreate,
    db: Session = Depends(get_db),
    actor: CurrentActor = Depends(get_current_actor),
):
    conversation = Conversation(
        id=str(uuid4()),
        title=request.title or "New conversation",
        owner_email=actor.email,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return serialize_conversation(conversation)


# ---------------------------------------------------------
# Get all conversations
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[ConversationResponse],
)
def get_conversations(
    db: Session = Depends(get_db),
    actor: CurrentActor = Depends(get_current_actor),
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.owner_email == actor.email)
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    return [serialize_conversation(conversation) for conversation in conversations]


# ---------------------------------------------------------
# Get conversation messages
# ---------------------------------------------------------

@router.get(
    "/{conversation_id}/messages",
    response_model=ConversationMessagesResponse,
)
def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    actor: CurrentActor = Depends(get_current_actor),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.owner_email == actor.email,
        )
        .one_or_none()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    document_cache: dict[str, Document | None] = {}
    messages = []
    for message in conversation.messages:
        current_sources = []
        for stored_source in message.sources or []:
            source = dict(stored_source)
            document_id = source.get("document_id")
            if not document_id and source.get("name"):
                document = (
                    db.query(Document)
                    .filter(Document.filename == source["name"])
                    .order_by(Document.created_at.desc())
                    .first()
                )
                document_id = document.id if document else None
            elif document_id not in document_cache:
                document_cache[document_id] = db.get(Document, document_id)
                document = document_cache[document_id]
            else:
                document = document_cache[document_id]

            role_allowed = bool(document and actor.role in (document.allowed_roles or []))
            source["document_id"] = document_id
            source["can_view"] = bool(
                document and (actor.role == "Admin" or (role_allowed and document.allow_view))
            )
            source["can_download"] = bool(
                document and (actor.role == "Admin" or (role_allowed and document.allow_download))
            )
            current_sources.append(source)
        messages.append(ConversationMessage(
            id=message.id,
            role=message.role,
            content=message.content,
            created_at=message.created_at,
            sources=current_sources,
        ))

    return ConversationMessagesResponse(
        conversation_id=conversation_id,
        messages=messages,
    )


# ---------------------------------------------------------
# Delete conversation
# ---------------------------------------------------------

@router.delete(
    "/{conversation_id}",
)
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    actor: CurrentActor = Depends(get_current_actor),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.owner_email == actor.email,
        )
        .one_or_none()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    db.delete(conversation)
    db.commit()

    return {
        "success": True,
        "message": "Conversation deleted.",
        "conversation_id": conversation_id,
    }
