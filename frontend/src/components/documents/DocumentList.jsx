import React, { useEffect, useState } from "react";
import {
    FileIcon,
    RefreshIcon,
    TrashIcon,
} from "../common/Icons";

function DocumentAccessControl({ document, onSave }) {
    const [permissions, setPermissions] = useState({
        rag_access: document.ragAccess,
        allow_view: document.allowView,
        allow_download: document.allowDownload,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setPermissions({
            rag_access: document.ragAccess,
            allow_view: document.allowView,
            allow_download: document.allowDownload,
        });
    }, [document.ragAccess, document.allowView, document.allowDownload]);

    const toggle = (name) => setPermissions((current) => ({
        ...current,
        [name]: !current[name],
    }));

    const save = async () => {
        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            await onSave(document.id, permissions);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 1800);
        } catch (requestError) {
            setError(requestError?.message || "Unable to save permissions.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="document-access-control">
            <strong>Document access</strong>
            <label><span>RAG access</span><input type="checkbox" checked={permissions.rag_access} onChange={() => toggle("rag_access")} /></label>
            <label><span>Open / view</span><input type="checkbox" checked={permissions.allow_view} onChange={() => toggle("allow_view")} /></label>
            <label><span>Download</span><input type="checkbox" checked={permissions.allow_download} onChange={() => toggle("allow_download")} /></label>
            <button type="button" onClick={save} disabled={saving}>{saving ? "Saving..." : saved ? "Saved" : "Save permissions"}</button>
            {error && <small className="document-access-error">{error}</small>}
        </div>
    );
}


export default function DocumentList({
    documents = [],
    onDelete,
    onReprocess,
    onPermissionsChange,
}) {
    return (
        <div className="documents-page">
            <div className="page-heading">
                <h1>Documents</h1>

                <p>
                    Manage documents currently connected to the
                    knowledge base.
                </p>
            </div>

            {documents.length === 0 ? (
                <div className="documents-empty">
                    <div className="documents-empty-icon">
                        <FileIcon size={22} />
                    </div>

                    <h3>No documents yet</h3>

                    <p>
                        Upload your first document to start building
                        the knowledge base.
                    </p>
                </div>
            ) : (
                <div className="documents-table">
                    <div className="documents-table-header">
                        <span>Document</span>
                        <span>Type</span>
                        <span>Size</span>
                        <span>Chunks</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>

                    {documents.map((document) => (
                        <div
                            className="document-row"
                            key={document.id}
                        >
                            <div className="document-name">
                                <div className="document-name-icon">
                                    {document.type || "FILE"}
                                </div>

                                <span title={document.name}>
                                    <strong>{document.name}</strong>
                                    <small>
                                        {document.chunkStrategy || "recursive"} · {document.chunkSize || 1000} chars · {document.chunkOverlap ?? 200} overlap
                                    </small>
                                </span>
                            </div>

                            <span>
                                {document.type || "-"}
                            </span>

                            <span>
                                {document.size || "-"}
                            </span>

                            <span>
                                {document.chunks ?? 0}
                            </span>

                            <span>
                                <span
                                    className={`document-status ${document.status?.toLowerCase() ===
                                            "ready"
                                            ? "ready"
                                            : "processing"
                                        }`}
                                >
                                    {document.status || "Processing"}
                                </span>
                            </span>

                            <div className="document-actions">
                                {onReprocess && (
                                    <button
                                        type="button"
                                        title="Reprocess"
                                        onClick={() => onReprocess(document.id)}
                                    >
                                        <RefreshIcon size={14} />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    title="Delete"
                                    onClick={() =>
                                        onDelete?.(document.id)
                                    }
                                >
                                    <TrashIcon size={14} />
                                </button>
                            </div>
                            <DocumentAccessControl
                                document={document}
                                onSave={onPermissionsChange}
                            />
                        </div>
                    ))}
                </div>
            )}

            <div className="document-summary">
                <span>
                    {documents.length}{" "}
                    {documents.length === 1
                        ? "document"
                        : "documents"}{" "}
                    in knowledge base
                </span>

                <span>
                    Ready documents are extracted, chunked, embedded, and searchable.
                </span>
            </div>
        </div>
    );
}
