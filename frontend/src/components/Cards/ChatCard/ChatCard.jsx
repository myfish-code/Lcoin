import { useNavigate } from "react-router-dom"

import styles from "./ChatCard.module.css"
import { useTranslation } from "react-i18next";

export default function ChatCard({ chat, myId }) {
    const { t } = useTranslation();

    const navigate = useNavigate();

    const opponent = chat.user1.id === myId ? chat.user2 : chat.user1
    const lastMsg = chat.last_message
    const isSentByMe = lastMsg?.sender_id === myId ? true : false

    const handleClick = () => {
        navigate(`/chats/${chat.id}`)
    }

    const navigateToPrifile = (e, id) => {
        e.stopPropagation();
        navigate(`/profile/${id}`);
        
    }

    return (
        <div className={styles.ChatCard} onClick={handleClick}>
            <div className={styles.name} onClick={(e) => navigateToPrifile(e, opponent.id)}>
                {opponent.name}
            </div>

            <div className={styles.lastMessage}>
                {lastMsg ? (
                    <p>
                        {isSentByMe && <span className={styles.mePrefix}>{t('chats.you')}: </span>}
                        {lastMsg.text}
                    </p>
                ) : (
                    <p className={styles.empty}>{t('chats.no_message')}</p>
                )}
            </div>
        </div>
    )
}