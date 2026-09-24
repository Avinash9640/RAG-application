from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    status: str
    uploaded_by: str
    allowed_roles: list[str]
    chunk_strategy: str
    chunk_size: int
    chunk_overlap: int
    rag_access: bool
    allow_view: bool
    allow_download: bool
    chunk_count: int
    created_at: datetime


class ChunkingConfiguration(BaseModel):
    strategy: str = "recursive"
    chunk_size: int = 1000
    overlap: int = 200


class DocumentPermissionsUpdate(BaseModel):
    rag_access: bool
    allow_view: bool
    allow_download: bool


class DocumentPermissionsResponse(DocumentPermissionsUpdate):
    document_id: str
