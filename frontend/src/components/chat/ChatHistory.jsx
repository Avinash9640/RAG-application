import React from "react";
import { MessageIcon, PlusIcon, TrashIcon } from "../common/Icons";


function ChatHistory({ chats = [], activeChatId, onSelectChat, onDeleteChat, onNewChat }) {
    return (
        <div className="chat-history-page">
            <div className="chat-history-header">
                <div>
                    <h1>Chat history</h1>
                    <p>{chats.length} saved conversation{chats.length === 1 ? "" : "s"}</p>
                </div>
                <button type="button" className="history-new-button" onClick={onNewChat}>
                    <PlusIcon size={16} /> New chat
                </button>
            </div>

            {chats.length === 0 ? (
                <div className="chat-history-empty">
                    <div className="chat-history-empty-icon"><MessageIcon size={22} /></div>
                    <h3>No conversations yet</h3>
                    <p>Start a conversation and it will appear here.</p>
                    <button type="button" className="primary-button" onClick={onNewChat}>Start a chat</button>
                </div>
            ) : (
                <div className="chat-history-list">
                    {chats.map((conversation) => {
                        const isActive = conversation.id === activeChatId;
                        return (
                            <article key={conversation.id}
                                className={`chat-history-item ${isActive ? "active" : ""}`}>
                                <button type="button" className="chat-history-open"
                                    onClick={() => onSelectChat(conversation.id)}>
                                    <span className="chat-history-icon"><MessageIcon size={17} /></span>
                                    <span className="chat-history-info">
                                        <strong className="chat-history-title">{conversation.title || "New conversation"}</strong>
                                        <span className="chat-history-preview">{conversation.preview || "No messages yet"}</span>
                                        <span className="chat-history-meta">
                                            {conversation.updatedAt || ""}
                                            {conversation.messageCount > 0 && ` · ${conversation.messageCount} messages`}
                                        </span>
                                    </span>
                                </button>
                                <button type="button" className="chat-history-delete" title="Delete conversation"
                                    aria-label={`Delete ${conversation.title || "conversation"}`}
                                    onClick={() => onDeleteChat(conversation.id)}><TrashIcon size={15} /></button>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ChatHistory;
