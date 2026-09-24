from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.audit_log import AuditLog


def test_document_to_cited_chat_pipeline_and_authorization():
    client = TestClient(app)
    suffix = uuid4().hex
    admin = {"X-Demo-User": f"admin-{suffix}@rag.local", "X-Demo-Role": "Admin"}
    user = {"X-Demo-User": f"user-{suffix}@rag.local", "X-Demo-Role": "User"}

    denied = client.post(
        "/api/documents",
        headers=user,
        files={"file": ("denied.txt", b"not stored", "text/plain")},
    )
    assert denied.status_code == 403

    upload = client.post(
        "/api/documents",
        headers=admin,
        files={
            "file": (
                "policy.txt",
                b"Employees receive twenty paid vacation days each year.",
                "text/plain",
            )
        },
        data={"chunk_strategy": "sentence", "chunk_size": "500", "chunk_overlap": "50"},
    )
    assert upload.status_code == 201, upload.text
    document_id = upload.json()["id"]
    conversation_id = None
    try:
        reprocessed = client.post(f"/api/documents/{document_id}/reprocess", headers=admin)
        assert reprocessed.status_code == 200, reprocessed.text

        answer = client.post(
            "/api/chat",
            headers=user,
            json={"message": "How many paid vacation days do employees receive?"},
        )
        assert answer.status_code == 200, answer.text
        payload = answer.json()
        conversation_id = payload["conversation_id"]
        assert payload["sources"][0]["name"] == "policy.txt"
        assert "twenty paid vacation days" in payload["message"]["content"].lower()

        other_user = {"X-Demo-User": "other@rag.local", "X-Demo-Role": "User"}
        hidden = client.get(
            f"/api/conversations/{conversation_id}/messages", headers=other_user
        )
        assert hidden.status_code == 404
    finally:
        if conversation_id:
            client.delete(f"/api/conversations/{conversation_id}", headers=user)
        client.delete(f"/api/documents/{document_id}", headers=admin)
        with SessionLocal() as db:
            db.query(AuditLog).filter(AuditLog.resource_id == document_id).delete()
            db.commit()
