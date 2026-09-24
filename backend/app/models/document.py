from datetime import datetime, timezone

from sqlalchemy import BigInteger, Boolean, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Uploaded")
    uploaded_by: Mapped[str] = mapped_column(String(255), nullable=False)
    allowed_roles: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=lambda: ["User", "Admin"]
    )
    chunk_strategy: Mapped[str] = mapped_column(
        String(30), nullable=False, default="recursive"
    )
    chunk_size: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    chunk_overlap: Mapped[int] = mapped_column(Integer, nullable=False, default=200)
    rag_access: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    allow_view: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    allow_download: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    chunks = relationship(
        "DocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentChunk.page_number, DocumentChunk.chunk_index",
    )
