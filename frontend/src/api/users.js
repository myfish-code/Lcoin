import { privateGet, privatePatch, privatePost } from "./utils";

const API_URL =  `${import.meta.env.VITE_API_URL}/users/`;

export async function getProfile(user_id, currentRole, currentPage, SIZE) {
    const params = new URLSearchParams({
        page: currentPage,
        page_size: SIZE,
    }).toString();
    
    return await privateGet(`${API_URL}profile/${user_id}/${currentRole}/?${params}`);
}

export async function changeLanguage(langChange) {
    return await privatePatch(`${API_URL}change-language/${langChange}/`);
}

export async function sendVerifyPhoto(photo) {
    const photoData = {
        photo: photo
    }
    return await privatePost(`${API_URL}verify/`, photoData)
}

export async function sendFeedBackMessage(feedBackMessage) {
    const feedBackData = {
        feedback: feedBackMessage
    }
    return await privatePost(`${API_URL}contact/`, feedBackData)
}