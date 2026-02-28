import styles from "./BidCard.module.css"
import { useNavigate } from 'react-router-dom';

import ActionConfirm from "../../ModalWindow/ActionConfirm/ActionConfirm";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function BidCard({ bid, onDelete }) {
    const { t } = useTranslation();

    const [isLoadingDel, setIsLoadingDel] = useState(false);
    const navigate = useNavigate();

    const canDelete = bid.order.status === "open" || bid.order.status === "pending";

    const handleClick = (id) => {
        navigate(`/search/${id}`);
    }

    const handleDelete = async () => {
        setIsLoadingDel(true);
        await onDelete();
        setIsLoadingDel(false);
    }
    return (
        <div className={styles.BidCard} onClick={() => handleClick(bid.order.id)}>
            <div className={styles.cardHeader}>
                <div className={styles.metaRow}>
                    <span className={styles.orderLabel}>{t('general.order')}:</span>
                    <span className={`${styles.statusOrder} ${styles[bid.order.status]}`}>{bid.order.status}</span>
                </div>

                <h3 className={styles.title}>{bid.order.name}</h3>

            </div>

            <div className={styles.myOffer}>
                <div className={styles.offerItem}>
                    <span>{t('bids.my_price')}:</span>
                    <strong className={styles.price}>{bid.price} EUR</strong>
                </div>
                <div className={styles.offerItem}>
                    <span>{t('bids.term')}:</span>
                    <strong>{bid.days_to_complete} {t('bids.day')}</strong>
                </div>
            </div>

            <div className={styles.orderContext}>
                <p className={styles.description}>{bid.description}</p>
            </div>

            <div className={styles.cardFooter}>
                <div className={styles.bidStatus}>
                    {t('bids.status_text')}: <b className={styles[bid.status]}>{bid.status}</b>
                </div>

                <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                    {canDelete ? (
                        <ActionConfirm
                            labelName={isLoadingDel ? (
                                <div className="g-loading-info">
                                    <p>{t('load.delete')}</p>
                                    <span className="dots">
                                        <span>.</span><span>.</span><span>.</span>
                                    </span>
                                </div>
                            ) : t('general.delete')}
                            confirmMessage={t('bids.confirm_delete')}
                            buttonClass={`${styles.deleteBtn} ${isLoadingDel && styles.disabledBtn}`}
                            onConfirm={() => handleDelete()}
                        />
                    ) : (
                        <button className={styles.disabledBtn} disabled>{t('general.block')}</button>
                    )}
                </div>
            </div>

        </div>
    )
}