from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.demo_auth import CurrentActor, get_current_actor, require_admin
from app.database import get_db
from app.models.document import Document
from app.schemas.document import (
    ChunkingConfiguration,
    DocumentPermissionsResponse,
    DocumentPermissionsUpdate,
    DocumentResponse,
)
from app.services.document_service import (
    create_document_chunks,
    remove_stored_file,
    remove_stored_document,
    save_document,
)
from app.services.audit_service import record_audit_event


router = APIRouter(prefix="/api/documents", tags=["Documents"])


def serialize_document(document: Document) -> DocumentResponse:
    return DocumentResponse(id=document.id, filename=document.filename,
                            file_type=document.file_type, file_size=document.file_size,
                            status=document.status, uploaded_by=document.uploaded_by,
                            allowed_roles=document.allowed_roles,
                            chunk_strategy=document.chunk_strategy,
                            chunk_size=document.chunk_size,
                            chunk_overlap=document.chunk_overlap,
                            rag_access=document.rag_access,
                            allow_view=document.allow_view,
                            allow_download=document.allow_download,
                            chunk_count=len(document.chunks),
                            created_at=document.created_at)


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    chunk_strategy: str = Form("recursive"),
    chunk_size: int = Form(1000, ge=100, le=10000),
    chunk_overlap: int = Form(200, ge=0, le=2000),
    db: Session = Depends(get_db),
    actor: CurrentActor = Depends(require_admin),
):
    if chunk_strategy not in {"fixed", "recursive", "sentence", "paragraph"}:
        raise HTTPException(status_code=400, detail="Unsupported chunking strategy.")
    if chunk_overlap >= chunk_size:
        raise HTTPException(status_code=400, detail="Chunk overlap must be smaller than chunk size.")
    document = save_document(
        file, actor.email, chunk_strategy, chunk_size, chunk_overlap
    )
    db.add(document)
    try:
        db.flush()
        chunks = create_document_chunks(document)
        db.add_all(chunks)
        document.status = "Ready"
        record_audit_event(
            db, actor, "document.uploaded", "document", document.id,
            {"filename": document.filename, "chunk_count": len(chunks)},
        )
        db.commit()
        db.refresh(document)
    except Exception:
        db.rollback()
        remove_stored_document(document)
        raise
    return serialize_document(document)


def _get_document_or_404(db: Session, document_id: str) -> Document:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    return document


def _can_access_file(document: Document, actor: CurrentActor, permission: str) -> bool:
    if actor.role == "Admin":
        return True
    if actor.role not in (document.allowed_roles or []):
        return False
    return bool(getattr(document, permission))


def _deny_and_audit(
    db: Session, actor: CurrentActor, document: Document, requested_action: str
) -> None:
    record_audit_event(
        db, actor, "DOCUMENT_ACCESS_DENIED", "document", document.id,
        {"requested_action": requested_action, "result": "denied"},
    )
    db.commit()
    raise HTTPException(status_code=403, detail="Document access is restricted by the administrator.")


@router.patch(
    "/{document_id}/permissions",
    response_model=DocumentPermissionsResponse,
)
def update_document_permissions(
    document_id: str,
    permissions: DocumentPermissionsUpdate,
    db: Session = Depends(get_db),
    actor: CurrentActor = Depends(require_admin),
):
    document = _get_document_or_404(db, document_id)
    previous = {
        "rag_access": document.rag_access,
        "allow_view": document.allow_view,
        "allow_download": document.allow_download,
    }
    document.rag_access = permissions.rag_access
    document.allow_view = permissions.allow_view
    document.allow_download = permissions.allow_download
    current = permissions.model_dump()
    record_audit_event(
        db, actor, "DOCUMENT_PERMISSION_UPDATED", "document", document.id,
        {"previous": previous, "new": current},
    )
    db.commit()
    return DocumentPermissionsResponse(document_id=document.id, **current)


@router.get("/{document_id}/view")
def view_document(
    document_id: str,
    db: Session = Depends(get_db),
    actor: CurrentActor = Depends(get_current_actor),
):
    document = _get_document_or_404(db, document_id)
    if not _can_access_file(document, actor, "allow_view"):
        _deny_and_audit(db, actor, document, "VIEW_DOCUMENT")
    path = Path(document.storage_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Stored document file was not found.")
    record_audit_event(
        db, actor, "VIEW_DOCUMENT", "document", document.id,
        {"result": "allowed"},
    )
    db.commit()
    return FileResponse(
        path, filename=document.filename, content_disposition_type="inline"
    )


@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    db: Session = Depends(get_db),
    actor: CurrentActor = Depends(get_current_actor),
):
    document = _get_document_or_404(db, document_id)
    if not _can_access_file(document, actor, "allow_download"):
        _deny_and_audit(db, actor, document, "DOWNLOAD_DOCUMENT")
    path = Path(document.storage_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Stored document file was not found.")
    record_audit_event(
        db, actor, "DOWNLOAD_DOCUMENT", "document", document.id,
        {"result": "allowed"},
    )
    db.commit()
    return FileResponse(
        path, filename=document.filename, content_disposition_type="attachment"
    )


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    _: CurrentActor = Depends(require_admin),
):
    documents = db.query(Document).order_by(Document.created_at.desc()).all()
    return [serialize_document(document) for document in documents]


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    actor: CurrentActor = Depends(require_admin),
):
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    storage_path = document.storage_path
    record_audit_event(
        db, actor, "document.deleted", "document", document.id,
        {"filename": document.filename},
    )
    db.delete(document)
    db.commit()
    remove_stored_file(storage_path)
    return {"success": True, "document_id": document_id}


@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
def reprocess_document(
    document_id: str,
    configuration: ChunkingConfiguration | None = None,
    db: Session = Depends(get_db),
    actor: CurrentActor = Depends(require_admin),
):
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    if configuration:
        if configuration.strategy not in {"fixed", "recursive", "sentence", "paragraph"}:
            raise HTTPException(status_code=400, detail="Unsupported chunking strategy.")
        if not 100 <= configuration.chunk_size <= 10000:
            raise HTTPException(status_code=400, detail="Chunk size must be between 100 and 10000.")
        if configuration.overlap < 0 or configuration.overlap >= configuration.chunk_size:
            raise HTTPException(status_code=400, detail="Overlap must be non-negative and smaller than chunk size.")
        document.chunk_strategy = configuration.strategy
        document.chunk_size = configuration.chunk_size
        document.chunk_overlap = configuration.overlap
    document.status = "Processing"
    try:
        document.chunks.clear()
        db.flush()
        chunks = create_document_chunks(document)
        db.add_all(chunks)
        document.status = "Ready"
        record_audit_event(
            db, actor, "document.reprocessed", "document", document.id,
            {"filename": document.filename, "chunk_count": len(chunks)},
        )
        db.commit()
        db.refresh(document)
    except Exception:
        db.rollback()
        raise
    return serialize_document(document)
