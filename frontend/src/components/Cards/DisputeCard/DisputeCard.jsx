import { useTranslation } from "react-i18next";
import styles from "./DisputeCard.module.css"
import { useNavigate } from "react-router-dom";

export default function DisputeCard({ dispute }) {
    const { t } = useTranslation();

    const navigate = useNavigate();

    const handleClick = (id) => {
        navigate(`/myDisputes/${id}`)
    }

    const handleProfileView = (e, id) => {
        e.stopPropagation();
        navigate(`/profile/${id}`)
    }



    return (
        <div className={styles.DisputeCard} onClick={() => handleClick(dispute.id)}>
            <div className={styles.cardHeader}>

                <div className={styles.metaRow}>
                    <span className={styles.orderLabel}>{t('general.order')}:</span>
                    <span className={`${styles.statusBadge} ${styles[dispute.status]}`}>
                        {dispute.status}
                    </span>
                </div>

                <h3 className={styles.title}>{dispute.order.name}</h3>
            </div>

            <div className={styles.Сompanion}>
                <div className={styles.disputeItem}>
                    <span>{t('disputes.initiator')}:</span>
                    <strong
                        className={styles.Initiator}
                        onClick={(e) => handleProfileView(e, dispute.author)}
                    >
                        {dispute.name.author}
                    </strong>
                </div>

                <div className={styles.disputeItem}>
                    <span>{t('disputes.defendant')}:</span>
                    <strong
                        className={styles.Defendant}
                        onClick={(e) => handleProfileView(e, dispute.opponent)}
                    >
                        {dispute.name.opponent}
                    </strong>
                </div>
            </div>

            <div className={styles.lastMessagePreview}>
                {dispute.last_message ? (
                    <>
                        <div className={styles.messageContent}>
                            <span className={styles.quoteIcon}>—</span>
                            <span className={styles.text}>{dispute.last_message.text}</span>
                        </div>
                        <span className={styles.messageTime}>
                            {new Date(dispute.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </>
                ) : (
                    <span className={styles.emptyHistory}>{t('chats.no_message')}...</span>
                )}
            </div>

            <div className={styles.cardFooter}>
                <span className={styles.date}>
                    {t('general.creation_text')}: {new Date(dispute.created_at).toLocaleString([], {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
            </div>


        </div>

    )
}