import styles from "./MyBidsForm.module.css"

import { Link } from "react-router-dom";

import BidCard from "../../Cards/BidCard/BidCard";
import RadioChoice from "../../Ui/RadioChoice/RadioChoice";
import { useTranslation } from "react-i18next";
import ErrorWindow from "../../Ui/ErrorWindow/ErrorWindow";
export default function MyBidsForm({onSubmit, bids, currentStatus, onTabChange, isLoading, error}) {
    const { t } = useTranslation();

    const handleDelete = async (id) => {
        if (!id) {
            return;
        }
        await onSubmit(id);
    }

    const handleBidTypeChange = (status) => {
        onTabChange(status)
    }

    const choices = [
        {id: 1, status: "pending", text: t('bids.status_pending')},
        {id: 2, status: "offer", text: t('bids.status_offer')},
        {id: 3, status: "accepted", text: t('bids.status_accepted')},
        {id: 4, status: "completed", text: t('bids.status_completed')},
    ]

    const textBids = {
        pending: t('bids.text_pending'),
        offer: t('bids.text_offer'),
        accepted: t('bids.text_accepted'),
        completed: t('bids.text_completed')
    }

    return (
        <div className={styles.Bids }>
            {error && (
                <ErrorWindow error={error}/>
            )}
            <RadioChoice 
                choices={choices}
                currentStatus={currentStatus}
                onTabChange={handleBidTypeChange}
                />

            {isLoading ? (
                <div className="g-loading-view">
                    <span className="g-loading-icon">📩</span>
                    <div className="g-loading-info">
                        <p>{t('load.bids')}</p>
                        <span className="dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </div>

                    <h4>{t('load.text_wait')}</h4>
                </div>
            ) : bids.length === 0 ? (
                <div className="g-empty-view">
                    <span className="g-empty-icon">📩</span>
                    <p>{textBids[currentStatus] || t('bids.text_general')}</p>
                    <h4><Link to="/search">{t('bids.text_choose')}</Link> {t('bids.text_offer_propose')}</h4>
                </div>
            ) : (
                
                bids.map((bid) => (
                    <div key={bid.id}>
                        <BidCard bid={bid} onDelete={() => handleDelete(bid.id)}/>
                    </div>
                ))
            )}
            
        </div>
    )
}