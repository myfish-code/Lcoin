import styles from "./ChatWindow.module.css"
import { useState } from "react"
import MessageItem from "./MessageItem/MessageItem"
import { MessageLoad } from "../../../config";
import { useTranslation } from "react-i18next";

export default function ChatWindow({ messages, currentUserId, isLoadingEdit, onEditMessage, onDeleteMessage, mode,
    onAcceptOffer, onDeclineOffer,
    onConfirmOrder,
    onOpenDispute,
    onSubmitReview,
    messageRemainLoad = 0, onLoadMoreMessage,
    scrollRef }) {

    const { t } = useTranslation();

    const maxMessageLoad = MessageLoad.max;
    const countToLoad = Math.min(maxMessageLoad, messageRemainLoad);
    const isModeChat = mode === "Chat";

    const [isMenuConfig, setIsMenuConfig] = useState({
        isOpen: false,
        x: 0,
        y: 0,
        messageId: null
    })
    
    

    const handleCloseMenu = () => {
        setIsMenuConfig({
            isOpen: false,
            x: 0,
            y: 0,
            messageId: null
        })
    }

    const handleOpenMenu = (e, id) => {
        e.preventDefault()
        e.stopPropagation();
        setIsMenuConfig({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            messageId: id
        })
    }

    return (
        <div className={styles.ChatWindow}
            onClick={() => isModeChat && isMenuConfig.isOpen && handleCloseMenu()}>
            <div className={styles.Messages} ref={scrollRef}>
                {messageRemainLoad > 0 && (
                    <div className={styles.loadMoreWrapper}>
                        <span className={styles.plainText}>
                            {t('chats.load_more_prefix')}{' '}
                        </span>

                        <span className={styles.clickableLink} onClick={onLoadMoreMessage}>
                            {countToLoad} {t('chats.load_more_suffix', { count: countToLoad})}
                        </span>

                        <div className={styles.totalCount}>
                            {t('chats.all_message')}: {messageRemainLoad} {' '}
                            {t('chats.load_more_suffix', { count: countToLoad})}
                        </div>
                    </div>
                )}
                {messages.map((message) => {
                    return (
                        <MessageItem
                            key={message.id}
                            message={message}
                            onOpenMenu={(e) => handleOpenMenu(e, message.id)}
                            isMenuConfig={isMenuConfig}
                            currentUserId={currentUserId}
                            isModeChat={isModeChat}
                            isLoadingEdit={isLoadingEdit}
                            onEdit={onEditMessage}
                            onDelete={onDeleteMessage}
                            onAcceptOffer={onAcceptOffer}
                            onDeclineOffer={onDeclineOffer}
                            onConfirmOrder={onConfirmOrder}
                            onOpenDispute={onOpenDispute}
                            onSubmitReview={onSubmitReview}
                        />
                    )
                })}
            </div>

        </div>
    )
}