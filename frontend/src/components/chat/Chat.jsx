import React, { useEffect, useRef, useState } from "react";

import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

import {
    SparklesIcon,
    DatabaseIcon,
    ChevronDownIcon,
} from "../common/Icons";

import { regenerateChatMessage, sendChatMessage } from "../../services/chatService";
import { getConversationMessages } from "../../services/conversationService";


const suggestions = [
    {
        title: "Summarize a document",
        description: "Get the key points from an internal document",
    },
    {
        title: "Find information",
        description: "Search your organization's knowledge",
    },
    {
        title: "Explain a policy",
        description: "Understand an internal policy or procedure",
    },
    {
        title: "Compare documents",
        description: "Compare information across documents",
    },
];


function buildExchanges(messages) {
    const exchanges = [];
    for (const message of messages) {
        if (message.role === "user") {
            const previous = exchanges[exchanges.length - 1];
            // Old regenerate behavior persisted the same question twice. Keep
            // one visible exchange and let the newest answer replace the old.
            if (previous?.user?.content === message.content && previous.assistant) {
                previous.awaitingReplacement = true;
                continue;
            }
            exchanges.push({ user: message, assistant: null });
            continue;
        }

        let exchange = exchanges[exchanges.length - 1];
        if (!exchange || (!exchange.user && exchange.assistant)) {
            exchange = { user: null, assistant: null };
            exchanges.push(exchange);
        }
        // Consecutive assistant messages are historical regeneration artifacts;
        // the newest answer is the one the user should see.
        exchange.assistant = message;
        exchange.awaitingReplacement = false;
    }
    return exchanges;
}


export default function Chat({
    activeChatId,
    onConversationPersisted,
}) {
    const [messages, setMessages] = useState([]);

    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState(null);

    const bottomRef = useRef(null);


    // ---------------------------------------------------------
    // Load/reset messages when active chat changes
    // ---------------------------------------------------------

    useEffect(() => {
        setError(null);

        if (!activeChatId) {
            setMessages([]);
            return undefined;
        }

        let cancelled = false;

        const loadMessages = async () => {
            try {
                const response = await getConversationMessages(activeChatId);
                if (!cancelled) {
                    setMessages(response.messages || []);
                }
            } catch (requestError) {
                if (!cancelled) {
                    console.error("Failed to load conversation messages:", requestError);
                    setMessages([]);
                    setError(requestError?.message || "Unable to load this conversation.");
                }
            }
        };

        loadMessages();

        return () => {
            cancelled = true;
        };
    }, [activeChatId]);


    // ---------------------------------------------------------
    // Scroll to latest message
    // ---------------------------------------------------------

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, isLoading]);


    // ---------------------------------------------------------
    // Send message to FastAPI
    // ---------------------------------------------------------

    const sendMessage = async ({
        content,
        attachments = [],
    }) => {
        const trimmedContent = content?.trim();

        if (!trimmedContent || isLoading) {
            return;
        }

        setError(null);

        const userMessage = {
            id: Date.now(),
            role: "user",
            content: trimmedContent,
            attachments,
        };

        setMessages((current) => [
            ...current,
            userMessage,
        ]);

        setIsLoading(true);

        try {
            const response = await sendChatMessage({
                message: trimmedContent,
                conversationId: activeChatId || null,
                attachments,
            });

            const assistantMessage = {
                id: Date.now() + 1,
                role: "assistant",
                content:
                    response?.message?.content ||
                    "I received your message, but the backend did not return an answer.",
                sources: response?.sources || [],
            };

            setMessages((current) => [
                ...current,
                assistantMessage,
            ]);

            onConversationPersisted?.(response.conversation_id);
        } catch (requestError) {
            console.error(
                "Chat request failed:",
                requestError
            );

            setError(
                requestError?.message ||
                "Unable to connect to the RAG Assistant backend."
            );

            setMessages((current) => [
                ...current,
                {
                    id: Date.now() + 1,
                    role: "assistant",
                    content:
                        "I couldn't connect to the RAG Assistant backend. Please make sure the FastAPI server is running.",
                    sources: [],
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };


    // ---------------------------------------------------------
    // Suggestion
    // ---------------------------------------------------------

    const handleSuggestion = (text) => {
        sendMessage({
            content: text,
            attachments: [],
        });
    };


    // ---------------------------------------------------------
    // Regenerate last assistant response
    // ---------------------------------------------------------

    const regenerateLastResponse = async () => {
        if (!messages.length || isLoading) {
            return;
        }

        const lastUserMessage = [...messages]
            .reverse()
            .find(
                (message) =>
                    message.role === "user"
            );

        if (!lastUserMessage) {
            return;
        }

        const lastAssistantIndex = [...messages]
            .map((message) => message.role)
            .lastIndexOf("assistant");

        if (lastAssistantIndex !== -1) {
            setMessages((current) =>
                current.slice(0, lastAssistantIndex)
            );
        }

        setError(null);
        setIsLoading(true);

        try {
            if (!activeChatId) {
                throw new Error("Save the conversation before regenerating its answer.");
            }
            const response = await regenerateChatMessage(activeChatId);

            const assistantMessage = {
                id: Date.now(),
                role: "assistant",
                content:
                    response?.message?.content ||
                    "The backend did not return an answer.",
                sources: response?.sources || [],
            };

            setMessages((current) => [
                ...current,
                assistantMessage,
            ]);
        } catch (requestError) {
            console.error(
                "Regenerate request failed:",
                requestError
            );

            setError(
                requestError?.message ||
                "Unable to regenerate the response."
            );

            setMessages((current) => [
                ...current,
                {
                    id: Date.now(),
                    role: "assistant",
                    content:
                        "I couldn't regenerate the response because the backend is unavailable.",
                    sources: [],
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };


    const isNewConversation =
        messages.length === 0;

    const exchanges = buildExchanges(messages);


    return (
        <div className="chat-page">

            {/* ------------------------------------------------ */}
            {/* Header */}
            {/* ------------------------------------------------ */}

            <header className="chat-header">

                <div className="chat-header-left">

                    <div className="chat-header-icon">
                        <SparklesIcon size={17} />
                    </div>

                    <div>
                        <h1>
                            {isNewConversation
                                ? "New conversation"
                                : "Knowledge Assistant"}
                        </h1>

                        <span>
                            {isNewConversation
                                ? "Ask questions about your organization"
                                : "Organizational knowledge"}
                        </span>
                    </div>

                </div>


                <div className="chat-header-right">

                    <div className="knowledge-status">
                        <span className="knowledge-status-dot" />

                        <span>
                            Knowledge Base
                        </span>

                        <ChevronDownIcon size={14} />
                    </div>

                </div>

            </header>


            {/* ------------------------------------------------ */}
            {/* Chat Body */}
            {/* ------------------------------------------------ */}

            <div className="chat-body">

                {isNewConversation ? (

                    /* ---------------------------------------- */
                    /* Welcome Screen */
                    /* ---------------------------------------- */

                    <div className="welcome-screen">

                        <div className="welcome-icon">
                            <SparklesIcon size={27} />
                        </div>

                        <h2>
                            What can I help with?
                        </h2>

                        <p>
                            Search and understand your organization's
                            knowledge using natural language.
                        </p>


                        <div className="suggestion-grid">

                            {suggestions.map(
                                (suggestion) => (

                                    <button
                                        type="button"
                                        className="suggestion-card"
                                        key={suggestion.title}
                                        onClick={() =>
                                            handleSuggestion(
                                                suggestion.title
                                            )
                                        }
                                        disabled={isLoading}
                                    >

                                        <span className="suggestion-card-title">
                                            {suggestion.title}
                                        </span>

                                        <span className="suggestion-card-description">
                                            {suggestion.description}
                                        </span>

                                    </button>

                                )
                            )}

                        </div>


                        <div className="welcome-note">

                            <DatabaseIcon size={15} />

                            <span>
                                Answers are grounded in your organization's
                                connected knowledge base.
                            </span>

                        </div>

                    </div>

                ) : (

                    /* ---------------------------------------- */
                    /* Messages */
                    /* ---------------------------------------- */

                    <div className="messages-container">

                        <div className="messages-inner">

                            {exchanges.map((exchange, index) => (
                                <section
                                    className="chat-exchange"
                                    key={exchange.user?.id || exchange.assistant?.id || index}
                                >
                                    {exchange.user && (
                                        <ChatMessage message={exchange.user} />
                                    )}
                                    {exchange.assistant && (
                                        <ChatMessage
                                            message={exchange.assistant}
                                            onRegenerate={
                                                index === exchanges.length - 1
                                                    ? regenerateLastResponse
                                                    : undefined
                                            }
                                        />
                                    )}
                                </section>
                            ))}


                            {/* -------------------------------- */}
                            {/* Error */}
                            {/* -------------------------------- */}

                            {error && (

                                <div className="chat-error">
                                    {error}
                                </div>

                            )}


                            {/* -------------------------------- */}
                            {/* Loading */}
                            {/* -------------------------------- */}

                            {isLoading && (

                                <div className="assistant-message loading-message">

                                    <div className="assistant-message-label">

                                        <div className="assistant-avatar">
                                            <span />
                                        </div>

                                        <span>
                                            RAG Assistant
                                        </span>

                                    </div>


                                    <div className="loading-indicator">

                                        <span />
                                        <span />
                                        <span />

                                    </div>

                                </div>

                            )}


                            <div ref={bottomRef} />

                        </div>

                    </div>

                )}


                {/* ------------------------------------------------ */}
                {/* Chat Input */}
                {/* ------------------------------------------------ */}

                <div className="chat-input-area">

                    <ChatInput
                        onSend={sendMessage}
                        disabled={isLoading}
                    />

                </div>

            </div>

        </div>
    );
}
