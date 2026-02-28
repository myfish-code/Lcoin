import styles from "./OrderCard.module.css";
import { useNavigate, Link } from "react-router-dom"

import ActionConfirm from "../../ModalWindow/ActionConfirm/ActionConfirm";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function OrderCard({ order, reviews, isProfileView = false, onDelete }) {
    const { t } = useTranslation();

    const [isLoadingDel, setIsLoadingDel] = useState(false);

    const navigate = useNavigate();

    const canDelete = order.status === "open" || order.status === "pending";
    const verificationStatus = order.author.verification_status
    const handleClick = () => {
        navigate(`/search/${order.id}`)
    }

    const handleTranslateTo = (e, id) => {
        e.stopPropagation();
        navigate(`/profile/${id}`);
    }

    const handleDelete = async () => {
        setIsLoadingDel(true);
        await onDelete();
        setIsLoadingDel(false);
    }

    return (
        <div className={styles.orderCard} onClick={handleClick}>
            <div className={styles.cardHeader}>
                <h3 className={styles.title}>{order.name}</h3>
                <span className={styles.price}>{order.price} EUR</span>
            </div>

            {!isProfileView &&
                <div className={styles.author}>
                    <span className={styles.authorUsername} onClick={(e) => handleTranslateTo(e, order.author.id)}>
                        {t('orders.customer')}: <b>{order.author.username}</b>
                    </span>
                    <span className={`${styles.statusBadge} ${styles[verificationStatus]}`}>
                        {verificationStatus}
                    </span>
                </div>
            }
            <p className={styles.description}>{order.description}</p>

            <div className={styles.subject}>{t(`subject.${order.subject}`)}</div>

            <div className={styles.cardFooter}>
                <div className={styles.bidsCount}>
                    <span className={styles.icon}>💬</span>
                    {t('orders.bid_text')}: {order.bids_count || 0}
                </div>
                <div className={`${styles.statusOrder} ${styles[order.status]}`}>
                    {order.status}
                </div>
            </div>

            {isProfileView && (
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
                            confirmMessage={t('orders.confirm_delete')}
                            buttonClass={`${styles.deleteBtn} ${isLoadingDel && styles.disabledBtn}`}
                            onConfirm={() => handleDelete()}
                        />
                    ) : (
                        <button className={styles.disabledBtn} disabled>{t('general.block')}</button>
                    )}
                </div>
            )}

            {order.status === "completed" && reviews && (
                <div className={styles.ReviewField}>
                    {reviews.executor ? (
                        <div className={styles.Review}>
                            <Link to={`/profile/${order.executor.id}`}
                                onClick={(e) => e.stopPropagation()}>
                                <span>{order.executor.username}</span>
                            </Link>

                            <span>{t('reviews.grade')}: {reviews.executor.grade} ⭐</span>

                            <p>{t('reviews.about_work')}: {reviews.executor.text}</p>
                        </div>
                    ) : (
                        <div className={styles.ReviewEmpty}>
                            <p>{t('reviews.executor_empty')}</p>
                        </div>
                    )}

                    {reviews.customer ? (
                        <div className={styles.Review}>
                            <Link to={`/profile/${order.author.id}`}
                                onClick={(e) => e.stopPropagation()}>
                                <span>{order.author.username}</span>
                            </Link>

                            <span>{t('reviews.grade')}: {reviews.customer.grade} ⭐</span>

                            <p>{t('reviews.about_work')}: {reviews.customer.text}</p>
                        </div>
                    ) : (
                        <div className={styles.ReviewEmpty}>
                            <p>{t('reviews.customer_empty')}</p>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}