import styles from "./MyChatsForm.module.css"
import ChatCard from "../../Cards/ChatCard/ChatCard"
import { useTranslation } from "react-i18next"
import ErrorWindow from "../../Ui/ErrorWindow/ErrorWindow";

export default function MyChatsForm({ chats, myId, error }) {
    const { t } = useTranslation();

    return (
        <div className={styles.chatsList}>
            {error && (
                <ErrorWindow error={error}/>
            )}
            {chats.length === 0 ? (
                <div className="g-empty-view">
                    <span className="g-empty-icon">🌐</span>
                    <p>{t('chats.empty_general')}</p>
                    <h4>{t('chats.empty_info')}</h4>
                </div>
            ) : (
                chats.map((chat) => (
                    <ChatCard key={chat.id} chat={chat} myId={myId} />
                    ))
            )}
        </div>

    )
}