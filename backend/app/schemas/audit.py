from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: str
    actor_email: str
    actor_role: str
    action: str
    resource_type: str
    resource_id: str
    details: dict[str, Any] | None
    created_at: datetime
