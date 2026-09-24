from typing import Optional

from pydantic import BaseModel, Field


class Attachment(BaseModel):
    name: str
    type: str
    size: int


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        description="User's chat message",
    )
    conversation_id: Optional[str] = None
    attachments: list[Attachment] = Field(default_factory=list)


class ChatRegenerateRequest(BaseModel):
    conversation_id: str


class Message(BaseModel):
    role: str
    content: str


class Source(BaseModel):
    document_id: str | None = None
    name: str
    page: int
    chunk_index: int
    can_view: bool = False
    can_download: bool = False


class ChatResponse(BaseModel):
    success: bool
    conversation_id: str
    message: Message
    sources: list[Source] = Field(default_factory=list)
    attachments: list[Attachment] = Field(default_factory=list)
