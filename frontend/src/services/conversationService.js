import { request } from "./api";


// ---------------------------------------------------------
// Get all conversations
// ---------------------------------------------------------

export async function getConversations() {
    return request("/api/conversations");
}


// ---------------------------------------------------------
// Create conversation
// ---------------------------------------------------------

export async function createConversation({
    title = null,
}) {
    return request("/api/conversations", {
        method: "POST",

        body: JSON.stringify({
            title,
        }),
    });
}


// ---------------------------------------------------------
// Get messages for conversation
// ---------------------------------------------------------

export async function getConversationMessages(
    conversationId
) {
    return request(
        `/api/conversations/${conversationId}/messages`
    );
}


// ---------------------------------------------------------
// Delete conversation
// ---------------------------------------------------------

export async function deleteConversation(
    conversationId
) {
    return request(
        `/api/conversations/${conversationId}`,
        {
            method: "DELETE",
        }
    );
}