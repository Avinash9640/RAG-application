import React, { useEffect, useState } from "react";

import Sidebar from "../../components/layout/Sidebar";
import Chat from "../../components/chat/Chat";
import ChatHistory from "../../components/chat/ChatHistory";
import UploadDocument from "../../components/documents/UploadDocument";
import DocumentList from "../../components/documents/DocumentList";
import ChunkingSettings from "../../components/rag/ChunkingSettings";
import Settings from "../../components/user/Settings";
import Profile from "../../components/user/Profile";
import AuditLog from "../../components/admin/AuditLog";
import { getAuditLogs } from "../../services/auditService";
import {
    deleteConversation,
    getConversations,
} from "../../services/conversationService";
import {
    deleteDocument,
    getDocuments,
    reprocessDocument,
    updateDocumentPermissions,
    uploadDocument,
} from "../../services/documentService";


const formatDate = (dateString) => {
    if (!dateString) return "";
    const difference = Date.now() - new Date(dateString).getTime();
    if (difference < 24 * 60 * 60 * 1000) return "Today";
    if (difference < 2 * 24 * 60 * 60 * 1000) return "Yesterday";
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
};


export default function AdminWorkspace({ user, onLogout }) {
    const [activePage, setActivePage] = useState("chat");
    const [chats, setChats] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadConversations = async () => {
        const response = await getConversations();
        setChats(response.map((conversation) => ({
            id: conversation.id,
            title: conversation.title,
            preview: conversation.preview || "No messages yet",
            messageCount: conversation.message_count || 0,
            updatedAt: formatDate(conversation.updated_at),
        })));
    };

    const loadDocuments = async () => {
        const response = await getDocuments();
        setDocuments(response.map((document) => ({
            id: document.id,
            name: document.filename,
            type: document.file_type,
            size: `${(document.file_size / 1024 / 1024).toFixed(2)} MB`,
            chunks: document.chunk_count,
            status: document.status,
            chunkStrategy: document.chunk_strategy,
            chunkSize: document.chunk_size,
            chunkOverlap: document.chunk_overlap,
            ragAccess: document.rag_access,
            allowView: document.allow_view,
            allowDownload: document.allow_download,
        })));
    };

    const loadAuditLogs = async () => {
        setAuditLogs(await getAuditLogs());
    };

    useEffect(() => {
        const loadWorkspace = async () => {
            try {
                setError(null);
                await Promise.all([loadConversations(), loadDocuments()]);
            } catch (requestError) {
                console.error("Failed to load admin workspace:", requestError);
                setError("Unable to load workspace data.");
            } finally {
                setIsLoading(false);
            }
        };
        loadWorkspace();
    }, []);

    const handleNewChat = () => {
        setActiveChatId(null);
        setActivePage("chat");
    };

    const handleDeleteChat = async (chatId) => {
        await deleteConversation(chatId);
        if (activeChatId === chatId) setActiveChatId(null);
        await loadConversations();
    };

    const handleUpload = async (file) => {
        await uploadDocument(file);
        await loadDocuments();
        setActivePage("documents");
    };

    const handleDeleteDocument = async (documentId) => {
        try {
            await deleteDocument(documentId);
            await loadDocuments();
        } catch (requestError) {
            setError(requestError?.message || "Unable to delete document.");
        }
    };

    const handleReprocessDocument = async (documentId) => {
        try {
            setError(null);
            await reprocessDocument(documentId);
            await loadDocuments();
        } catch (requestError) {
            setError(requestError?.message || "Unable to reprocess document.");
        }
    };

    const handlePermissionsChange = async (documentId, permissions) => {
        try {
            setError(null);
            await updateDocumentPermissions(documentId, permissions);
            await loadDocuments();
        } catch (requestError) {
            setError(requestError?.message || "Unable to update document permissions.");
            throw requestError;
        }
    };

    const renderContent = () => {
        switch (activePage) {
            case "history":
                return <ChatHistory chats={chats} activeChatId={activeChatId}
                    onSelectChat={(id) => { setActiveChatId(id); setActivePage("chat"); }}
                    onDeleteChat={handleDeleteChat} onNewChat={handleNewChat} />;
            case "upload":
                return <UploadDocument onUpload={handleUpload} />;
            case "documents":
                return <DocumentList documents={documents} onDelete={handleDeleteDocument}
                    onReprocess={handleReprocessDocument}
                    onPermissionsChange={handlePermissionsChange} />;
            case "chunking": return <ChunkingSettings />;
            case "audit": return <AuditLog records={auditLogs} />;
            case "settings": return <Settings user={user} />;
            case "profile": return <Profile user={user} />;
            default:
                return <Chat activeChatId={activeChatId} onConversationPersisted={async (id) => {
                    setActiveChatId(id);
                    await loadConversations();
                }} />;
        }
    };

    return (
        <div className="rag-app">
            <Sidebar role="Admin" activePage={activePage}
                onNavigate={(page) => {
                    if (page === "new-chat") handleNewChat();
                    else {
                        if (page === "documents") loadDocuments();
                        if (page === "history") loadConversations();
                        if (page === "audit") loadAuditLogs();
                        setActivePage(page);
                    }
                }}
                onLogout={onLogout} />
            <main className="workspace">
                <div className="workspace-topbar">
                    <div className="workspace-topbar-left"><div className="workspace-indicator" /><span>RAG Assistant</span></div>
                    <div className="workspace-topbar-right"><div className="connection-status"><span className="connection-dot" /><span>Knowledge base connected</span></div><div className="topbar-avatar">A</div></div>
                </div>
                {error && <div className="workspace-error">{error}</div>}
                <div className="workspace-content">
                    {isLoading ? <div className="workspace-loading">Loading workspace...</div> : renderContent()}
                </div>
            </main>
        </div>
    );
}
