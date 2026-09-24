import { request } from "./api";


export async function sendChatMessage({
    message,
    conversationId = null,
    attachments = [],
}) {
    return request("/api/chat", {
        method: "POST",

        body: JSON.stringify({
            message,
            conversation_id: conversationId,

            attachments: attachments.map(
                (file) => ({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                })
            ),
        }),
    });
}


export async function regenerateChatMessage(conversationId) {
    return request("/api/chat/regenerate", {
        method: "POST",
        body: JSON.stringify({ conversation_id: conversationId }),
    });
}
