import React from "react";
import {
    PlusIcon,
    MessageIcon,
    ClockIcon,
    UploadIcon,
    FileIcon,
    LayersIcon,
    SettingsIcon,
    UserIcon,
    ChevronDownIcon,
    LogOutIcon,
    DatabaseIcon,
} from "../common/Icons";

function NavItem({ icon: Icon, label, active, onClick }) {
    return (
        <button
            type="button"
            className={`sidebar-nav-item ${active ? "active" : ""}`}
            onClick={onClick}
        >
            <Icon size={17} />
            <span>{label}</span>
        </button>
    );
}

export default function Sidebar({
    role = "User",
    activePage = "chat",
    onNavigate,
    onLogout,
}) {
    const isAdmin = role === "Admin";

    return (
        <aside className="app-sidebar">
            <div className="sidebar-top">
                <div className="brand">
                    <div className="brand-mark">
                        <span />
                        <span />
                        <span />
                    </div>

                    <div className="brand-text">
                        <strong>RAG Studio</strong>
                        <small>Knowledge Assistant</small>
                    </div>
                </div>

                <button
                    type="button"
                    className="new-chat-button"
                    onClick={() => onNavigate?.("new-chat")}
                >
                    <PlusIcon size={17} />
                    <span>New chat</span>
                </button>
            </div>

            <div className="sidebar-content">
                <section className="sidebar-section">
                    <div className="sidebar-section-label">Workspace</div>

                    <NavItem
                        icon={MessageIcon}
                        label="Chat"
                        active={activePage === "chat"}
                        onClick={() => onNavigate?.("chat")}
                    />

                    <NavItem
                        icon={ClockIcon}
                        label="Chat history"
                        active={activePage === "history"}
                        onClick={() => onNavigate?.("history")}
                    />
                </section>

                {isAdmin && (
                    <section className="sidebar-section admin-section">
                        <div className="sidebar-section-label">Knowledge</div>

                        <NavItem
                            icon={UploadIcon}
                            label="Upload document"
                            active={activePage === "upload"}
                            onClick={() => onNavigate?.("upload")}
                        />

                        <NavItem
                            icon={FileIcon}
                            label="Documents"
                            active={activePage === "documents"}
                            onClick={() => onNavigate?.("documents")}
                        />

                        <NavItem
                            icon={LayersIcon}
                            label="Chunking"
                            active={activePage === "chunking"}
                            onClick={() => onNavigate?.("chunking")}
                        />

                        <NavItem
                            icon={ClockIcon}
                            label="Access audit"
                            active={activePage === "audit"}
                            onClick={() => onNavigate?.("audit")}
                        />
                    </section>
                )}

                <section className="sidebar-section sidebar-status-section">
                    <div className="sidebar-section-label">System</div>

                    <div className="engine-status">
                        <div className="status-dot" />

                        <div>
                            <strong>Knowledge base</strong>
                            <span>Connected</span>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="storage-card">
                            <div className="storage-header">
                                <span>
                                    <DatabaseIcon size={15} />
                                    Storage
                                </span>
                                <span>2.4 GB</span>
                            </div>

                            <div className="storage-track">
                                <div className="storage-fill" />
                            </div>

                            <span className="storage-meta">2.4 GB of 10 GB used</span>
                        </div>
                    )}
                </section>
            </div>

            <div className="sidebar-bottom">
                <NavItem
                    icon={SettingsIcon}
                    label="Settings"
                    active={activePage === "settings"}
                    onClick={() => onNavigate?.("settings")}
                />

                <button
                    type="button"
                    className={`profile-row ${activePage === "profile" ? "active" : ""}`}
                    onClick={() => onNavigate?.("profile")}
                >
                    <div className="profile-avatar">A</div>

                    <div className="profile-info">
                        <strong>Avinash</strong>
                        <span>{role}</span>
                    </div>

                    <ChevronDownIcon size={15} />
                </button>

                {onLogout && (
                    <button type="button" className="logout-button" onClick={onLogout}>
                        <LogOutIcon size={16} />
                        Sign out
                    </button>
                )}
            </div>
        </aside>
    );
}
