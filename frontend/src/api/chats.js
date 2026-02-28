import { privateGet, privatePost, privateDelete, privatePatch } from "./utils";
const API_URL =  `${import.meta.env.VITE_API_URL}/chat/`;

export async function getMyChats() {
    return await privateGet(`${API_URL}chats/`);
}

export async function getMyChatDetail(chatId, maxMessageLoad) {
    const params = new URLSearchParams({
        "limit": maxMessageLoad,
        "mode": "getMyChatDetail"
    }).toString()
    return await privateGet(`${API_URL}chats/${chatId}/?${params}`);
}

export async function getMoreMessages(chatId, firstId, maxMessageLoad) {
    const params = new URLSearchParams({
        "first_message_id": firstId,
        "limit": maxMessageLoad,
        "mode": "getMoreMessage"
    }).toString()
    return await privateGet(`${API_URL}chats/${chatId}/?${params}`);
}

export async function getUpdatedMessages(chatId, maxMessageLoad) {
    const params = new URLSearchParams({
        "limit": maxMessageLoad,
        "mode": "getUpdatedMessages"
    }).toString()
    return await privateGet(`${API_URL}chats/${chatId}/?${params}`);
}


export async function postMyChatMessage(chatId, textMessage) {
    const formData = {
        text: textMessage
    }
    return await privatePost(`${API_URL}chats/${chatId}/`, formData);
}

export async function deleteMyMessage(messageId) {
    return await privateDelete(`${API_URL}messages/${messageId}/`) 
}

export async function updateMyMessage(messageId, textMessage) {
    const formData = {
        text: textMessage
    }
    
    return await privatePatch(`${API_URL}messages/${messageId}/`, formData)
}

export async function createChat(userId) {
    return await privatePost(`${API_URL}chats/create/${userId}/`);
}