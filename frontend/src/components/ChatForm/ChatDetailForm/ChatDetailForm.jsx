import styles from "./ChatDetailForm.module.css"

import { useNavigate} from "react-router-dom";
import { useState } from "react";

import ChatWindow from "../ChatWindow/ChatWindow";
import { useTranslation } from "react-i18next";
import ErrorWindow from "../../Ui/ErrorWindow/ErrorWindow";

export default function ChatDetailForm({onPostMessage,
                                        onDeleteMessage,
                                        onUpdateMessage,
                                        onAcceptOffer,
                                        onDeclineOffer,
                                        onConfirmCompleted,
                                        onSendReview,
                                        onOpenDispute,
                                        error,
                                        messages,
                                        currentUserId,
                                        messageRemainLoad, onLoadMoreMessage,
                                        scrollRef}) 
{
    const { t } = useTranslation();    

    const [isLoadingEdit, setIsLoadingEdit] = useState(false);

    const [textMessage, setTextMessage] = useState("");
    const [editingMessage, setEditingMessage] = useState(null);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!textMessage.trim()) {
            return;
        }
        if (editingMessage) {
            if (textMessage.trim() === editingMessage.text.trim()) {
                setTextMessage("");
                setEditingMessage(null);
                return;
            }  
            setIsLoadingEdit(true);

            await onUpdateMessage({messageId: editingMessage.id, textMessage: textMessage.trim()});
            setTextMessage("");
            setEditingMessage(null);
            setIsLoadingEdit(false);
        } else {
            await onPostMessage(textMessage.trim());
            setTextMessage("");
        }
    }

    const handleDelete = async (messageId) => {
        await onDeleteMessage(messageId);
    }

    const handleRefactor = async (message) => {
        setEditingMessage(message);
        setTextMessage(message.text);
    }

    const handleSubmitReview = async(orderId, messageId, text, rating) => {

        await onSendReview(orderId, messageId, text, rating);
    }
    const handleAcceptOffer = async (orderId, messageId) => {
        await onAcceptOffer(orderId, messageId);
        
    }

    const handleDeclineOffer = async (orderId, messageId) => {
        await onDeclineOffer(orderId, messageId);
        
    }

    const handleConfirmCompleted = async (orderId, messageId) => {
        await onConfirmCompleted({orderId, messageId});
    }

    const handleOpenDispute = async (orderId, messageId) => {
        await onOpenDispute({orderId, messageId});
    }

    return (
        <div className={styles.Chatwrapper}>
            {error && (
                <ErrorWindow error={error} />
            )}
            <ChatWindow 
                currentUserId={currentUserId}
                messages={messages}
                onSendMessage={onPostMessage}
                isLoadingEdit={isLoadingEdit}
                onEditMessage={(message) => handleRefactor(message)}
                onDeleteMessage={(message) => handleDelete(message.id)}
                onAcceptOffer={handleAcceptOffer}
                onDeclineOffer={handleDeclineOffer}
                onConfirmOrder={handleConfirmCompleted}
                onOpenDispute={handleOpenDispute}
                onSubmitReview={handleSubmitReview}
                mode="Chat"
                messageRemainLoad={messageRemainLoad}
                onLoadMoreMessage={onLoadMoreMessage}
                scrollRef={scrollRef}

            />

            <div className={styles.FormSend}>
                <form onSubmit={handleSendMessage}>
                    <textarea
                        className={styles.TextArea}
                        placeholder={t('chats.placeholder_input')}
                        value={textMessage}
                        onChange={(e) => setTextMessage(e.target.value)}>
                    </textarea>

                    <button type="submit" className={styles.SendBtn}>
                        {editingMessage ? t('chats.refactor') : t('chats.send')}
                    </button>
                </form>
            </div>


        </div>
    )
}