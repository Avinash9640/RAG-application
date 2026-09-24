import React, { useState } from "react";
import {
    CopyIcon,
    RefreshIcon,
    ChevronDownIcon,
    CheckIcon,
} from "../common/Icons";
import { downloadDocument, openDocument } from "../../services/documentService";

export default function ChatMessage({
    message,
    onRegenerate,
}) {
    const [sourcesOpen, setSourcesOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sourceError, setSourceError] = useState(null);

    const isUser = message.role === "user";

    const runSourceAction = async (action) => {
        setSourceError(null);
        try {
            await action();
        } catch (error) {
            setSourceError(error?.message || "Document access failed.");
        }
    };

    const copyMessage = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 1500);
        } catch {
            // Clipboard may be unavailable in some browsers.
        }
    };

    if (isUser) {
        return (
            <div className="chat-message user-message">
                <div className="message-user-label">
                    <div className="message-avatar user-avatar">A</div>
                    <span>You</span>
                </div>

                <div className="user-message-content">
                    {message.content}
                </div>

                {message.attachments?.length > 0 && (
                    <div className="message-attachments">
                        {message.attachments.map((file, index) => (
                            <div className="message-attachment" key={`${file.name}-${index}`}>
                                <span className="attachment-icon">PDF</span>
                                <div>
                                    <strong>{file.name}</strong>
                                    <span>Attached document</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="chat-message assistant-message">
            <div className="assistant-message-label">
                <div className="assistant-avatar">
                    <span />
                </div>

                <span>RAG Assistant</span>
            </div>

            <div className="assistant-message-content">
                {message.content}
            </div>

            {message.sources?.length > 0 && (
                <div className="sources-container">
                    <button
                        type="button"
                        className="sources-header"
                        onClick={() => setSourcesOpen((value) => !value)}
                    >
                        <div className="sources-title">
                            <span className="sources-symbol">◈</span>
                            <span>Sources</span>
                            <span className="sources-count">
                                {message.sources.length}
                            </span>
                        </div>

                        <ChevronDownIcon
                            size={15}
                            className={sourcesOpen ? "rotate-icon" : ""}
                        />
                    </button>

                    {sourcesOpen && (
                        <div className="sources-list">
                            {message.sources.map((source, index) => (
                                <div className="source-item" key={`${source.name}-${index}`}>
                                    <div className="source-number">{index + 1}</div>

                                    <div className="source-details">
                                        <strong>{source.name}</strong>

                                        <span>
                                            {source.page
                                                ? `Page ${source.page}`
                                                : "Knowledge base"}
                                        </span>
                                        <div className="source-actions">
                                            {source.can_view && source.document_id && (
                                                <button type="button" onClick={() => runSourceAction(() => openDocument(source.document_id))}>
                                                    Open document
                                                </button>
                                            )}
                                            {source.can_download && source.document_id && (
                                                <button type="button" onClick={() => runSourceAction(() => downloadDocument(source.document_id, source.name))}>
                                                    Download
                                                </button>
                                            )}
                                            {!source.can_view && !source.can_download && (
                                                <small>Original document access restricted by administrator.</small>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {sourceError && <div className="source-access-error">{sourceError}</div>}
                </div>
            )}

            <div className="assistant-actions">
                <button type="button" onClick={copyMessage}>
                    {copied ? (
                        <>
                            <CheckIcon size={14} />
                            Copied
                        </>
                    ) : (
                        <>
                            <CopyIcon size={14} />
                            Copy
                        </>
                    )}
                </button>

                {onRegenerate && (
                    <button type="button" onClick={onRegenerate}>
                        <RefreshIcon size={14} />
                        Regenerate
                    </button>
                )}
            </div>
        </div>
    );
}
