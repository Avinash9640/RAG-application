import json

from sqlalchemy.orm import Session

from app.core.demo_auth import CurrentActor
from app.models.audit_log import AuditLog


def record_audit_event(
    db: Session,
    actor: CurrentActor,
    action: str,
    resource_type: str,
    resource_id: str,
    details: dict | None = None,
) -> None:
    db.add(AuditLog(
        actor_email=actor.email,
        actor_role=actor.role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=json.dumps(details) if details else None,
    ))
