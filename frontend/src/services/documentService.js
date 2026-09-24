import { request, requestBlob } from "./api";


export async function getDocuments() {
    return request("/api/documents");
}


export async function uploadDocument(file) {
    const formData = new FormData();
    formData.append("file", file);
    let settings = {};
    try {
        settings = JSON.parse(localStorage.getItem("rag-chunking-settings") || "{}");
    } catch {
        settings = {};
    }
    formData.append("chunk_strategy", settings.strategy || "recursive");
    formData.append("chunk_size", String(settings.chunkSize || 1000));
    formData.append("chunk_overlap", String(settings.overlap ?? 200));

    return request("/api/documents", {
        method: "POST",
        body: formData,
    });
}


export async function deleteDocument(documentId) {
    return request(`/api/documents/${documentId}`, {
        method: "DELETE",
    });
}


export async function reprocessDocument(documentId) {
    let settings = {};
    try {
        settings = JSON.parse(localStorage.getItem("rag-chunking-settings") || "{}");
    } catch {
        settings = {};
    }
    return request(`/api/documents/${documentId}/reprocess`, {
        method: "POST",
        body: JSON.stringify({
            strategy: settings.strategy || "recursive",
            chunk_size: Number(settings.chunkSize || 1000),
            overlap: Number(settings.overlap ?? 200),
        }),
    });
}


export async function updateDocumentPermissions(documentId, permissions) {
    return request(`/api/documents/${documentId}/permissions`, {
        method: "PATCH",
        body: JSON.stringify(permissions),
    });
}


export async function openDocument(documentId) {
    const { blob } = await requestBlob(`/api/documents/${documentId}/view`);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}


export async function downloadDocument(documentId, filename) {
    const { blob } = await requestBlob(`/api/documents/${documentId}/download`);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "document";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}
