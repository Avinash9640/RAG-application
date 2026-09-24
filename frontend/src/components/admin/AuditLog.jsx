import React from "react";


const formatDate = (value) => value
    ? new Date(value).toLocaleString()
    : "";


export default function AuditLog({ records = [] }) {
    return (
        <div className="audit-page">
            <div className="page-heading">
                <h1>Access audit</h1>
                <p>Review document permission changes and file-access attempts.</p>
            </div>
            {records.length === 0 ? (
                <div className="audit-empty">No document access events recorded yet.</div>
            ) : (
                <div className="audit-list">
                    {records.map((record) => (
                        <div className="audit-row" key={record.id}>
                            <div><strong>{record.action.replaceAll("_", " ")}</strong><span>{record.actor_email} · {record.actor_role}</span></div>
                            <div><span>Document</span><code>{record.resource_id}</code></div>
                            <div><span>Details</span><small>{record.details ? JSON.stringify(record.details) : "—"}</small></div>
                            <time>{formatDate(record.created_at)}</time>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
