import { useState } from "react";
import OrderCard from "../../Cards/OrderCard/OrderCard";
import ChatWindow from "../../ChatForm/ChatWindow/ChatWindow";

import styles from "./DisputesDetailForm.module.css"
import { useTranslation } from "react-i18next";
import ErrorWindow from "../../Ui/ErrorWindow/ErrorWindow";

export default function DisputesDetailForm({dispute, order, messages, currentUserId, onSendDisputeMessage,
    messageRemainLoad, onLoadMoreMessage,
    scrollRef,
     error}) {

    const { t } = useTranslation();

    const [textMessage, setTextMessage] = useState("");

    const handleSendMessage = async(e) => {
        e.preventDefault();
        if (!textMessage.trim()) {
            return;
        }

        await onSendDisputeMessage(textMessage);
        setTextMessage("");
    }

    return (
        <div className={styles.wrapper}>
            {error && (
                <ErrorWindow error={error}/>
            )}
            
            <OrderCard order={order} isProfileView = {false} />
            
            <ChatWindow 
                messages={messages}
                currentUserId={currentUserId}
                mode="Dispute"
                messageRemainLoad={messageRemainLoad}
                onLoadMoreMessage={onLoadMoreMessage}
                scrollRef={scrollRef}
                />

                <div className={styles.FormSend}>
                    <form onSubmit={handleSendMessage}>
                        <textarea className={styles.TextArea}
                            placeholder={t('chats.placeholder_input')}
                            value={textMessage}
                            onChange={(e) => setTextMessage(e.target.value)}>
                        </textarea>

                        <div className={styles.ButtonSend}>
                            <button type="submit">{t('chats.send')}</button>
                        </div>
                    </form>
                </div>
        </div>
    )
}



