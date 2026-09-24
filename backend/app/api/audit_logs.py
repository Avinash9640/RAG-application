import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.demo_auth import CurrentActor, require_admin
from app.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse


router = APIRouter(prefix="/api/audit-logs", tags=["Audit logs"])


@router.get("", response_model=list[AuditLogResponse])
def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: CurrentActor = Depends(require_admin),
):
    records = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        AuditLogResponse(
            id=record.id,
            actor_email=record.actor_email,
            actor_role=record.actor_role,
            action=record.action,
            resource_type=record.resource_type,
            resource_id=record.resource_id,
            details=json.loads(record.details) if record.details else None,
            created_at=record.created_at,
        )
        for record in records
    ]
