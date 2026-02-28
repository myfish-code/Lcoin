import styles from "./MyDisputesForm.module.css"

import DisputeCard from "../../Cards/DisputeCard/DisputeCard";
import RadioChoice from "../../Ui/RadioChoice/RadioChoice";
import { useTranslation } from "react-i18next";
import ErrorWindow from "../../Ui/ErrorWindow/ErrorWindow";

export default function MyDisputesForm({ currentStatus, onTabChange, disputes, isLoading, error }) {

    const { t } = useTranslation();

    const handleDisputeStatusChange = (status) => {
        onTabChange(status);
    }

    const choices = [
        { id: 1, status: "open", text: t('disputes.status_open') },
        { id: 2, status: "on_review", text: t('disputes.status_review') },
        { id: 3, status: "resolved", text: t('disputes.status_resolved') },
        { id: 4, status: "closed", text: t('disputes.status_closed') },
    ]

    const textDisputes = {
        open: t('disputes.text_open'),
        on_review: t('disputes.text_review'),
        resolved: t('disputes.text_resolved'),
        closed: t('disputes.text_closed')
    }

    return (
        <div className={styles.DisputesForm}>
            {error && (
                <ErrorWindow error={error} />
            )}

            <RadioChoice
                choices={choices}
                currentStatus={currentStatus}
                onTabChange={handleDisputeStatusChange} />

            {isLoading ? (
                <div className="g-loading-view">
                    <span className="g-loading-icon">⚠️</span>
                    <div className="g-loading-info">
                        <p>{t('load.disputes')}</p>
                        <span className="dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </div>

                    <h4>{t('load.text_wait')}</h4>
                </div>
            ) : disputes.length === 0 ? (
                <div className="g-empty-view">
                    <span className="g-empty-icon">⚠️</span>
                    <p>{textDisputes[currentStatus] || t('disputes.text_general')}</p>
                    <h3>{t('disputes.text_good')}! ✅</h3>
                </div>
            ) : (
                disputes.map((dispute) => (
                    <div key={dispute.id}>
                        <DisputeCard dispute={dispute} />
                    </div>
                ))
            )}
        </div>
    )
}