import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DisputesDetailForm from "../../../components/DisputesForm/DisputesDetailForm/DisputesDetailForm"
import { MessageLoad } from "../../../config";

import {
    getMoreDisputeMessages, getMyDisputeDetail, getUpdatedDisputeMessages, postDisputeMessage
} from "../../../api/orders";
import Loading from "../../../components/Ui/Loading/Loading";
import NotFoundPage from "../../../components/Ui/NotFoundPage/NotFoundPage";
import { useErrorHandler } from "../../../hooks/useErrorHandler";


const mergeMessages = (prevMessages, newMessages) => {
    const messageMap = new Map(prevMessages.map(msg => [msg.id, msg]));

    newMessages.forEach(msg => {
        messageMap.set(msg.id, msg)
    })

    return Array.from(messageMap.values()).sort((a, b) => a.id - b.id);

}

export default function MyDisputesDetail() {

    const navigate = useNavigate();

    const { disputeId } = useParams();
    const [messageRemain, setMessageRemain] = useState(null);
    const maxMessageLoad = MessageLoad.max;

    const [isLoading, setIsLoading] = useState(true);
    const handleError = useErrorHandler();
    const [errorData, setErrorData] = useState(null);

    const [dispute, setDispute] = useState(null);
    const [order, setOrder] = useState(null);
    const [messages, setMessages] = useState(null);
    const messagesRef = useRef(null);

    const scrollRef = useRef(null);
    const isInitialFirstRef = useRef(true);
    const scrollHeightBeforeRef = useRef(0);
    const isSendMessageRef = useRef(false);

    const [currentUserId, setCurrentUserId] = useState(null);

    const handleSendDisputeMessage = async (description) => {
        if (!description.trim() || !disputeId) {
            return;
        }

        const formData = {
            description
        }

        try {
            const data = await postDisputeMessage(disputeId, formData);
            const new_message = data.message
            isSendMessageRef.current = true;

            setMessages((prevMessages) => [...prevMessages, new_message])
            setErrorData(null);
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    const handleGetMoreMessage = () => {
        let firstId = 0
        if (messages !== null && messages.length > 0) {
            firstId = messages[0].id
        }
        getMoreDisputeMessages(disputeId, firstId, maxMessageLoad).then((data) => {
            const new_load = data.messages;

            scrollHeightBeforeRef.current = scrollRef.current.scrollHeight;

            setMessages(prevMessages => [
                ...new_load,
                ...prevMessages
            ]);
            setMessageRemain(data.messageRemain);
            setCurrentUserId(data.user_id);

            setErrorData(null);

        }).catch((error) => {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        }).finally(() => {

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
            });
            isSendMessageRef.current = false;
        }
        if (scrollHeightBeforeRef.current > 0) {
            const heightDifference = container.scrollHeight - scrollHeightBeforeRef.current;

            container.scrollTop = heightDifference;
            scrollHeightBeforeRef.current = 0;

        }
        if (messages && messages.length > 0 && isInitialFirstRef.current) {
            container.scrollTop = container.scrollHeight;
            isInitialFirstRef.current = false
        }
    }, [messages])

    useEffect(() => {
        let timerId;

        const startCheck = async () => {
            try {
                const currentMessages = messagesRef.current;
                if (currentMessages) {

                    const data = await getUpdatedDisputeMessages(disputeId, maxMessageLoad);

                    if (data.messages && data.messages.length > 0) {
                        setMessages(prevMessages => mergeMessages(prevMessages, data.messages))
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
        getMyDisputeDetail(disputeId, maxMessageLoad).then((data) => {
            setOrder(data.order);
            setDispute(data.dispute);
            setMessages(data.messages);
            setMessageRemain(data.messageRemain);
            setCurrentUserId(data.user_id);

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

    if (errorData?.type === "NOT_FOUND" || (!order)) {
        return <NotFoundPage />
    }

    return (
        <DisputesDetailForm
            dispute={dispute}
            order={order}
            messages={messages}
            currentUserId={currentUserId}
            onSendDisputeMessage={handleSendDisputeMessage}
            messageRemainLoad={messageRemain}
            onLoadMoreMessage={handleGetMoreMessage}
            scrollRef={scrollRef}
            error={errorData} />
    )


}