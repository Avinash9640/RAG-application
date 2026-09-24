from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.demo_auth import CurrentActor
from app.models.conversation import Conversation
from app.models.message import Message as MessageModel
from app.schemas.chat import ChatRequest, ChatResponse, Message, Source
from app.services.retrieval_service import retrieve_authorized_chunks
from app.services.llm_service import generate_grounded_answer


FOLLOW_UP_WORDS = {"he", "her", "hers", "him", "his", "it", "its", "she", "that", "they", "their", "them"}


def _retrieval_query(question: str, previous_questions: list[str]) -> str:
    words = {word.lower().strip(".,?!:;") for word in question.split()}
    if not (words & FOLLOW_UP_WORDS) or not previous_questions:
        return question
    context = " ".join(previous_questions[-3:])
    return f"{question}\nEarlier conversation subjects: {context}"


def _answer_for(
    question: str,
    db: Session,
    actor: CurrentActor,
    previous_questions: list[str] | None = None,
):
    search_query = _retrieval_query(question, previous_questions or [])
    retrieved_chunks = retrieve_authorized_chunks(db, actor, search_query)
    sources = [
        Source(
            document_id=chunk.document.id,
            name=chunk.document.filename,
            page=chunk.page_number,
            chunk_index=chunk.chunk_index,
            can_view=actor.role == "Admin" or chunk.document.allow_view,
            can_download=actor.role == "Admin" or chunk.document.allow_download,
        )
        for chunk in retrieved_chunks
    ]
    return generate_grounded_answer(question, retrieved_chunks), sources

def process_chat(
    request: ChatRequest,
    db: Session,
    actor: CurrentActor,
) -> ChatResponse:

    # -----------------------------------------------------
    # Get or create conversation
    # -----------------------------------------------------

    conversation_id = request.conversation_id

    if conversation_id:
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
    else:
        conversation = Conversation(
            id=str(uuid4()),
            title=request.message[:60],
            owner_email=actor.email,
        )
        db.add(conversation)
        db.flush()
        conversation_id = conversation.id

    previous_questions = [
        message.content for message in conversation.messages if message.role == "user"
    ]


    # -----------------------------------------------------
    # Store user message
    # -----------------------------------------------------

    user_message = MessageModel(
        id=str(uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=request.message,
    )
    db.add(user_message)

    if conversation.title == "New conversation":
        conversation.title = request.message[:60]


    # -----------------------------------------------------
    # Authorization has already been resolved in the route dependency before
    # retrieval. The retrieval service applies the permitted-document filter.
    # -----------------------------------------------------

    assistant_content, sources = _answer_for(
        request.message, db, actor, previous_questions
    )


    # -----------------------------------------------------
    # Store assistant message
    # -----------------------------------------------------

    assistant_message = MessageModel(
        id=str(uuid4()),
        conversation_id=conversation_id,
        role="assistant",
        content=assistant_content,
        sources=[source.model_dump() for source in sources],
    )
    db.add(assistant_message)
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()


    # -----------------------------------------------------
    # Return response
    # -----------------------------------------------------

    return ChatResponse(
        success=True,
        conversation_id=conversation_id,
        message=Message(
            role="assistant",
            content=assistant_content,
        ),
        sources=sources,
        attachments=request.attachments,
    )


def regenerate_chat(
    conversation_id: str,
    db: Session,
    actor: CurrentActor,
) -> ChatResponse:
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.owner_email == actor.email,
        )
        .one_or_none()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    last_user_message = next(
        (message for message in reversed(conversation.messages) if message.role == "user"),
        None,
    )
    if not last_user_message:
        raise HTTPException(status_code=409, detail="No user message is available to regenerate.")

    # Replace assistant messages after the last user message. Never persist the
    # user's question a second time.
    for message in list(conversation.messages):
        if message.role == "assistant" and message.created_at >= last_user_message.created_at:
            db.delete(message)

    previous_questions = [
        message.content
        for message in conversation.messages
        if message.role == "user" and message.id != last_user_message.id
    ]
    assistant_content, sources = _answer_for(
        last_user_message.content, db, actor, previous_questions
    )
    db.add(MessageModel(
        id=str(uuid4()),
        conversation_id=conversation_id,
        role="assistant",
        content=assistant_content,
        sources=[source.model_dump() for source in sources],
    ))
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()

    return ChatResponse(
        success=True,
        conversation_id=conversation_id,
        message=Message(role="assistant", content=assistant_content),
        sources=sources,
        attachments=[],
    )
