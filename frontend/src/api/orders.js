import { privateDelete, privateGet, privatePost } from "./utils";

const API_URL =  `${import.meta.env.VITE_API_URL}/homework/`;

export async function getOrders(currentPage, SIZE, validatedBidsMax, validatedPriceMin, validatedSubjects) {
    const params = new URLSearchParams({
        page: currentPage,
        page_size: SIZE,
    })

    if (validatedPriceMin !== null) params.append("price_min", validatedPriceMin);
    if (validatedBidsMax !== null) params.append("bids_max", validatedBidsMax);

    validatedSubjects.forEach(element => {
        params.append("subjects", element)
    });


    const url = `${API_URL}search/?${params}`;
    return await privateGet(url);
}

export async function getMyOrders(currentStatus, currentPage, SIZE) {
    const params = new URLSearchParams({
        page: currentPage,
        page_size: SIZE
    }).toString();
    return await privateGet(`${API_URL}orders/${currentStatus}/?${params}`);
}

export async function postMyOrder(name, description, price, deadline_time, subject, fileUpload, currentStatus, currentPage, SIZE) {
    const orderData = { 
        name, 
        description, 
        price, 
        deadline_time, 
        subject,
        currentStatus,
        page: currentPage,
        page_size: SIZE,
        file_upload: fileUpload
    };

    return await privatePost(`${API_URL}orders/`, orderData)
}

export async function deleteMyOrder(orderId) {
    return privateDelete(`${API_URL}orders/${orderId}/delete/`)
}

export async function getOrderDetail(orderId) {
    return await privateGet(`${API_URL}search/${orderId}/`);
}

export async function getMyBids(currentStatus, currentPage, SIZE) {
    const params = new URLSearchParams({
        page: currentPage,
        page_size: SIZE,
    }).toString()

    return await privateGet(`${API_URL}bids/${currentStatus}/?${params}`);
}

export async function postMyBid(description, price, daysToComplete, orderId) {
    const bidData = {
        description,
        price,
        days_to_complete: daysToComplete
    }

    return await privatePost(`${API_URL}search/${orderId}/bid/`, bidData);
}

export async function deleteMyBid(bidId) {
    return await privateDelete(`${API_URL}bids/${bidId}/delete/`);
}


export async function assignExecutor(bidId, finalPrice, finalDays) {
    const formData = {
        final_price: finalPrice,
        final_days: finalDays
    }
    return await privatePost(`${API_URL}search/bids/assign/${bidId}/`, formData);
}

export async function unAssignExecutor(orderId) {
    return await privateDelete(`${API_URL}search/orders/unassign/${orderId}/`);
}

export async function acceptOffer(orderId, messageId) {
    return await privatePost(`${API_URL}search/orders/confirm/${orderId}/${messageId}/`);
}

export async function declineOffer(orderId, messageId) {
    return await privateDelete(`${API_URL}search/orders/decline/${orderId}/${messageId}/`);
}

export async function completeOrder(orderId, messageId) {
    return await privatePost(`${API_URL}search/orders/complete/${orderId}/${messageId}/`)
}

export async function sendReview(orderId, messageId, formData) {
    return await privatePost(`${API_URL}search/orders/review/${orderId}/${messageId}/`, formData)
}

export async function openDispute(orderId, messageId) {
    return await privatePost(`${API_URL}search/orders/dispute/${orderId}/${messageId}/`);
}

export async function getMyDisputes(disputeStatus, currentPage, SIZE) {
    const params = new URLSearchParams({
        page: currentPage,
        page_size: SIZE
    }).toString();

    return await privateGet(`${API_URL}disputes/${disputeStatus}/?${params}`)
}

export async function getMyDisputeDetail(disputeId, limit) {
    const params = new URLSearchParams({
        "limit": limit,
        "mode": "getMyDisputeDetail"
    }).toString()
    return await privateGet(`${API_URL}dispute/${disputeId}/?${params}`);
}

export async function getMoreDisputeMessages(disputeId, firstId, limit) {
    const params = new URLSearchParams({
        "first_message_id": firstId,
        "limit": limit,
        "mode": "getMoreDisputeMessages"
    }).toString()
    return await privateGet(`${API_URL}dispute/${disputeId}/?${params}`);
}

export async function getUpdatedDisputeMessages(disputeId, limit) {
    const params = new URLSearchParams({
        "limit": limit,
        "mode": "getUpdatedDisputeMessages"
    }).toString()
    return await privateGet(`${API_URL}dispute/${disputeId}/?${params}`);
}

export async function postDisputeMessage(disputeId, formData) {
    return await privatePost(`${API_URL}dispute/${disputeId}/`, formData)
}