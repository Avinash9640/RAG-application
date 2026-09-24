import React, { useEffect, useState } from "react";

import Sidebar from "../../components/layout/Sidebar";
import Chat from "../../components/chat/Chat";
import ChatHistory from "../../components/chat/ChatHistory";
import Settings from "../../components/user/Settings";
import Profile from "../../components/user/Profile";

import {
    getConversations,
    deleteConversation,
} from "../../services/conversationService";


export default function UserWorkspace({
    user,
    onLogout,
}) {
    const [activePage, setActivePage] = useState("chat");

    const [chats, setChats] = useState([]);

    const [activeChatId, setActiveChatId] = useState(null);

    const [isLoadingChats, setIsLoadingChats] =
        useState(true);

    const [error, setError] = useState(null);


    // ---------------------------------------------------------
    // Load conversations from backend
    // ---------------------------------------------------------

    useEffect(() => {
        loadConversations();
    }, []);


    const loadConversations = async () => {
        try {
            setIsLoadingChats(true);
            setError(null);

            const response =
                await getConversations();

            const formattedChats =
                response.map((conversation) => ({
                    id: conversation.id,
                    title: conversation.title,
                    preview: conversation.preview || "No messages yet",
                    messageCount: conversation.message_count || 0,
                    updatedAt: formatDate(
                        conversation.updated_at
                    ),
                }));

            setChats(formattedChats);
        } catch (requestError) {
            console.error(
                "Failed to load conversations:",
                requestError
            );

            setError(
                "Unable to load chat history."
            );
        } finally {
            setIsLoadingChats(false);
        }
    };


    // ---------------------------------------------------------
    // Create new conversation
    // ---------------------------------------------------------

    const handleNewChat = () => {
        setError(null);
        setActiveChatId(null);
        setActivePage("chat");
    };


    // ---------------------------------------------------------
    // Select conversation
    // ---------------------------------------------------------

    const handleSelectChat = (chatId) => {
        setActiveChatId(chatId);
        setActivePage("chat");
    };


    const handleConversationPersisted = async (conversationId) => {
        setActiveChatId(conversationId);
        await loadConversations();
    };


    // ---------------------------------------------------------
    // Delete conversation
    // ---------------------------------------------------------

    const handleDeleteChat = async (chatId) => {
        try {
            setError(null);

            await deleteConversation(chatId);

            setChats((current) =>
                current.filter(
                    (chat) =>
                        chat.id !== chatId
                )
            );

            if (activeChatId === chatId) {
                setActiveChatId(null);
            }
        } catch (requestError) {
            console.error(
                "Failed to delete conversation:",
                requestError
            );

            setError(
                "Unable to delete the conversation."
            );
        }
    };


    // ---------------------------------------------------------
    // Format backend date
    // ---------------------------------------------------------

    const formatDate = (dateString) => {
        if (!dateString) {
            return "";
        }

        const date = new Date(dateString);

        const now = new Date();

        const difference =
            now.getTime() -
            date.getTime();

        const oneDay =
            24 * 60 * 60 * 1000;

        if (difference < oneDay) {
            return "Today";
        }

        if (difference < 2 * oneDay) {
            return "Yesterday";
        }

        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
            }
        );
    };


    // ---------------------------------------------------------
    // Render content
    // ---------------------------------------------------------

    const renderContent = () => {
        switch (activePage) {

            case "history":
                return (
                    <ChatHistory
                        chats={chats}
                        activeChatId={
                            activeChatId
                        }
                        onSelectChat={
                            handleSelectChat
                        }
                        onDeleteChat={
                            handleDeleteChat
                        }
                        onNewChat={
                            handleNewChat
                        }
                    />
                );


            case "settings":
                return (
                    <Settings user={user} />
                );


            case "profile":
                return (
                    <Profile user={user} />
                );


            case "chat":
            default:
                return (
                    <Chat
                        activeChatId={
                            activeChatId
                        }
                        onConversationPersisted={
                            handleConversationPersisted
                        }
                    />
                );
        }
    };


    return (
        <div className="rag-app">

            <Sidebar
                role="User"
                activePage={activePage}
                onNavigate={(page) => {

                    if (page === "new-chat") {
                        handleNewChat();
                    } else if (page === "history") {
                        loadConversations();
                        setActivePage("history");
                    } else if (page === "chat") {
                        setActivePage("chat");
                    } else {
                        setActivePage(page);
                    }

                }}
                onLogout={onLogout}
            />


            <main className="workspace">

                <div className="workspace-topbar">

                    <div className="workspace-topbar-left">

                        <div className="workspace-indicator" />

                        <span>
                            RAG Assistant
                        </span>

                    </div>


                    <div className="workspace-topbar-right">

                        <div className="connection-status">

                            <span className="connection-dot" />

                            Knowledge base connected

                        </div>


                        <div className="topbar-avatar">
                            A
                        </div>

                    </div>

                </div>


                {error && (
                    <div className="workspace-error">
                        {error}
                    </div>
                )}


                <div className="workspace-content">

                    {isLoadingChats ? (
                        <div className="workspace-loading">
                            Loading conversations...
                        </div>
                    ) : (
                        renderContent()
                    )}

                </div>

            </main>

        </div>
    );
}
