import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { useNavigate, Link, useParams } from "react-router-dom"

import { MessageLoad } from "../../config";

import ChatDetailForm from "../../components/ChatForm/ChatDetailForm/ChatDetailForm";
import {
    getMyChatDetail,
    postMyChatMessage,
    deleteMyMessage,
    updateMyMessage,
    getMoreMessages,
    getUpdatedMessages
} from "../../api/chats";

import {
    acceptOffer,
    declineOffer,
    completeOrder,
    sendReview,
    openDispute
} from "../../api/orders";
import Loading from "../../components/Ui/Loading/Loading";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import NotFoundPage from "../../components/Ui/NotFoundPage/NotFoundPage";

const mergeMessages = (prevMessages, newMessages) => {

    const messageMap = new Map(prevMessages.map(msg => [msg.id, msg]));

    newMessages.forEach(msg => {
        messageMap.set(msg.id, msg);
    });

    return Array.from(messageMap.values()).sort((a, b) => a.id - b.id);
};

export default function ChatDetail() {
    const { chatId } = useParams();

    const navigate = useNavigate();

    const [currentUserId, setCurrentUserId] = useState(null);

    const [messageRemain, setMessageRemain] = useState(null);
    const [messages, setMessages] = useState(null);
    const messagesRef = useRef(null);

    const scrollRef = useRef(null);
    const isInitialFirstRef = useRef(true);
    const scrollHeightBeforeRef = useRef(0);
    const isSendMessageRef = useRef(false);

    const [isLoading, setIsLoading] = useState(true);
    const handleError = useErrorHandler();
    const [errorData, setErrorData] = useState(null);

    const maxMessageLoad = MessageLoad.max;

    const handleSendMessage = async (textMessage) => {
        if (!textMessage.trim()) {
            return;
        }

        try {

            const data = await postMyChatMessage(chatId, textMessage);

            if (data && data.message) {
                isSendMessageRef.current = true;
                setMessages(prev => [
                    ...prev,
                    data.message
                ]);
            }
            setErrorData(null);
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    const handleDeleteMessage = async (messageId) => {
        if (!messageId) {
            return;
        }

        try {
            const data = await deleteMyMessage(messageId);

            if (data && data.message_delete) {
                const message_delete = data.message_delete;
                setMessages(prevMessages =>
                    prevMessages.map(message =>
                        message.id === message_delete.id ? message_delete : message
                    )
                )
            }
            setErrorData(null);
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    const handleUpdateMessage = async ({ messageId, textMessage }) => {
        if (!textMessage.trim()) {
            return;
        }

        try {
            const data = await updateMyMessage(messageId, textMessage);
            if (data && data.message_patch) {
                const message_patch = data.message_patch;

                setMessages(prevMessages =>
                    prevMessages.map(message =>
                        message.id === message_patch.id ? message_patch : message
                    )
                );
            }
            setErrorData(null)
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    const handleAcceptOffer = async (orderId, messageId) => {
        if (!orderId || !messageId) {
            return;
        }

        try {
            const data = await acceptOffer(orderId, messageId);
            if (!data || !data.message) {
                return;
            }
            const updateMessage = data.message

            setMessages(prevMessages =>
                prevMessages.map(message =>
                    message.id === messageId && message.type === "offer" ? updateMessage : message
                )
            );
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }

    }

    const handleDeclineOffer = async (orderId, messageId) => {
        if (!orderId || !messageId) {
            return;
        }

        try {
            const data = await declineOffer(orderId, messageId);
            if (!data || !data.message) {
                return;
            }
            const updateMessage = data.message

            setMessages(prevMessages =>
                prevMessages.map(message =>
                    message.id === messageId && message.type === "offer" ? updateMessage : message
                )
            );
            setErrorData(null);
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    const handleConfirmCompleted = async ({ orderId, messageId }) => {
        if (!orderId || !messageId) {
            return;
        }

        try {
            const data = await completeOrder(orderId, messageId);
            const updateMessage = data.message

            setMessages(prevMessages =>
                prevMessages.map(message =>
                    message.id === messageId && message.type === "offer_accepted" ? updateMessage : message
                )
            );
            setErrorData(null);
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    const handleSendReview = async (orderId, messageId, textReview, gradeReview) => {

        if (!orderId || !messageId) {
            return;
        }

        try {
            const formData = {
                "text": textReview,
                "grade": gradeReview
            }

            const data = await sendReview(orderId, messageId, formData);

            const updateMessage = data.message

            setMessages(prevMessages =>
                prevMessages.map(message =>
                    message.id === messageId ? updateMessage : message
                )
            )
            setErrorData(null);
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    const handleOpenDispute = async ({ orderId, messageId }) => {
        if (!orderId || !messageId) {
            return;
        }

        try {
            const data = await openDispute(orderId, messageId);
            const updateMessage = data.message
            setMessages(prevMessages =>
                prevMessages.map(message =>
                    message.id === updateMessage.id ? updateMessage : message
                )
            )
            setErrorData(null);

        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    const handleGetMoreMessage = async () => {
        let firstId = 0
        if (messages !== null && messages.length > 0) {
            firstId = messages[0].id
        }
        getMoreMessages(chatId, firstId, maxMessageLoad).then((data) => {
            const new_load = data.messages;

            scrollHeightBeforeRef.current = scrollRef.current.scrollHeight;

            setMessages(prevMessages => [
                ...new_load,
                ...prevMessages
            ]);


            setMessageRemain(data.messageRemain);
            setCurrentUserId(data.userId);
            setErrorData(null);
        }).catch((error) => {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        }).finally(() => {
            setIsLoading(false);
        });
    }

    useLayoutEffect(() => {

        const container = scrollRef.current;

        if (!isSendMessageRef.current) {
            messagesRef.current = messages
        }

        if (isSendMessageRef.current) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: "smooth"
            })
            isSendMessageRef.current = false;
        }
        if (scrollHeightBeforeRef.current > 0) {
            const heightDifference = container.scrollHeight - scrollHeightBeforeRef.current;

            container.scrollTop = heightDifference;
            scrollHeightBeforeRef.current = 0;
        }

        if (messages && messages.length > 0 && isInitialFirstRef.current) {
            container.scrollTop = container.scrollHeight
            isInitialFirstRef.current = false
        }
    }, [messages])

    useEffect(() => {
        let timerId;

        const startCheck = async () => {
            try {
                const currentMessages = messagesRef.current;
                if (currentMessages) {
                    const data = await getUpdatedMessages(chatId, maxMessageLoad);
                    if (data.messages && data.messages.length > 0) {
                        setMessages(prev => mergeMessages(prev, data.messages));
                    }
                }
                setErrorData(null);
            } catch (error) {
                const result = handleError(error);
                if (result.type !== 'REDIRECT') {
                    setErrorData(result);
                }
            } finally {
                timerId = setTimeout(() => {
                    startCheck();

                }, 3000)
            }

        }

        startCheck();

        return () => clearTimeout(timerId);
    }, [])

    useEffect(() => {

        setIsLoading(true);
        getMyChatDetail(chatId, maxMessageLoad).then((data) => {
            setMessages(data.messages);
            setMessageRemain(data.messageRemain);
            setCurrentUserId(data.userId);
            setErrorData(null);
        }).catch((error) => {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        }).finally(() => {
            setIsLoading(false);
        });

    }, [navigate])

    if (isLoading) {
        return <Loading />
    }

    if (errorData?.type === "NOT_FOUND" || (!messages)) {
        return <NotFoundPage />
    }

    return <ChatDetailForm
        onPostMessage={handleSendMessage}
        onDeleteMessage={handleDeleteMessage}
        onUpdateMessage={handleUpdateMessage}
        onAcceptOffer={handleAcceptOffer}
        onDeclineOffer={handleDeclineOffer}
        onConfirmCompleted={handleConfirmCompleted}
        onSendReview={handleSendReview}
        onOpenDispute={handleOpenDispute}
        messages={messages}
        error={errorData}
        currentUserId={currentUserId}
        messageRemainLoad={messageRemain}
        onLoadMoreMessage={handleGetMoreMessage}
        scrollRef={scrollRef}
    />
}