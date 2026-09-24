from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.chat import Source


class ConversationCreate(BaseModel):
    title: Optional[str] = None


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    preview: str | None = None
    message_count: int = 0


class ConversationMessage(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime
    sources: list[Source] = Field(default_factory=list)


class ConversationMessagesResponse(BaseModel):
    conversation_id: str
    messages: list[ConversationMessage]
