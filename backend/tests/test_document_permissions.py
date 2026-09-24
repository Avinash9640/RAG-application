from uuid import uuid4

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.audit_log import AuditLog


def test_document_permission_matrix_persists_and_is_audited():
    client = TestClient(app)
    suffix = uuid4().hex
    admin = {"X-Demo-User": f"acl-admin-{suffix}@rag.local", "X-Demo-Role": "Admin"}
    user = {"X-Demo-User": f"acl-user-{suffix}@rag.local", "X-Demo-Role": "User"}
    filename = f"acl-quasarcodezeta-{suffix}.txt"
    upload = client.post(
        "/api/documents",
        headers=admin,
        files={"file": (filename, b"Quasarcodezeta approval level is emerald.", "text/plain")},
    )
    assert upload.status_code == 201, upload.text
    document_id = upload.json()["id"]
    conversation_ids: list[str] = []

    def permissions(rag: bool, view: bool, download: bool):
        response = client.patch(
            f"/api/documents/{document_id}/permissions",
            headers=admin,
            json={
                "rag_access": rag,
                "allow_view": view,
                "allow_download": download,
            },
        )
        assert response.status_code == 200, response.text
        return response.json()

    def ask():
        response = client.post(
            "/api/chat",
            headers=user,
            json={"message": f"What is the approval level in {filename}?"},
        )
        assert response.status_code == 200, response.text
        conversation_ids.append(response.json()["conversation_id"])
        return response.json()

    try:
        # RAG + view + download.
        answer = ask()
        assert any(source["document_id"] == document_id for source in answer["sources"])
        assert client.get(f"/api/documents/{document_id}/view", headers=user).status_code == 200
        assert client.get(f"/api/documents/{document_id}/download", headers=user).status_code == 200

        # RAG + view, no download.
        permissions(True, True, False)
        assert any(source["document_id"] == document_id for source in ask()["sources"])
        assert client.get(f"/api/documents/{document_id}/view", headers=user).status_code == 200
        assert client.get(f"/api/documents/{document_id}/download", headers=user).status_code == 403

        # RAG only: citations remain, original file access is denied.
        permissions(True, False, False)
        answer = ask()
        target_source = next(
            source for source in answer["sources"] if source["document_id"] == document_id
        )
        assert target_source["can_view"] is False
        assert target_source["can_download"] is False
        assert client.get(f"/api/documents/{document_id}/view", headers=user).status_code == 403
        assert client.get(f"/api/documents/{document_id}/download", headers=user).status_code == 403

        # No access: the document is outside the vector-search scope.
        permissions(False, False, False)
        assert all(source["document_id"] != document_id for source in ask()["sources"])
        assert client.get(f"/api/documents/{document_id}/view", headers=user).status_code == 403
        assert client.get(f"/api/documents/{document_id}/download", headers=user).status_code == 403

        # A fresh app client observes the PostgreSQL-persisted state.
        fresh_client = TestClient(app)
        documents = fresh_client.get("/api/documents", headers=admin)
        persisted = next(item for item in documents.json() if item["id"] == document_id)
        assert persisted["rag_access"] is False
        assert persisted["allow_view"] is False
        assert persisted["allow_download"] is False

        audit = client.get("/api/audit-logs?limit=500", headers=admin)
        assert audit.status_code == 200
        actions = {
            record["action"] for record in audit.json()
            if record["resource_id"] == document_id
        }
        assert "DOCUMENT_PERMISSION_UPDATED" in actions
        assert "DOCUMENT_ACCESS_DENIED" in actions
        assert "VIEW_DOCUMENT" in actions
        assert "DOWNLOAD_DOCUMENT" in actions
    finally:
        for conversation_id in conversation_ids:
            client.delete(f"/api/conversations/{conversation_id}", headers=user)
        client.delete(f"/api/documents/{document_id}", headers=admin)
        with SessionLocal() as db:
            db.query(AuditLog).filter(AuditLog.resource_id == document_id).delete()
            db.commit()
