import styles from "./BidInfo.module.css"

import { Link } from "react-router-dom"
import { useState } from "react";

import ActionConfirm from "../../ModalWindow/ActionConfirm/ActionConfirm";
import { useTranslation } from "react-i18next";

export default function BidInfo({
    bid, order, isAuthor, userBidId,
    onDeleteBid,
    onAssignExecutor,
    onUnAssignExecutor
}) {

    const { t } = useTranslation();

    const [isLoadingDelBid, setIsLoadingDelBid] = useState(false);
    const [isLoadingAssignExec, setIsLoadingAssignExec] = useState(false);
    const [isLoadingUnAssignExec, setIsLoadingUnAssignExec] = useState(false);

    const conditionLoading = isLoadingAssignExec || isLoadingUnAssignExec;

    const [confirmingBidId, setConfirmingBidId] = useState(null);
    const [finalPrice, setFinalPrice] = useState("");
    const [finalDays, setFinalDays] = useState("");

    const author = bid.author;
    const bidId = bid.id;
    const orderStatus = order.status
    const isUserBid = userBidId === bidId;
    const verificationStatus = author.verification_status || "unverified"
    const [error, setError] = useState(null);

    const handleDeleteBid = async (bidId) => {
        setIsLoadingDelBid(true);
        await onDeleteBid(bidId);
        setIsLoadingDelBid(false);
    }

    const handleUnAssignExecutor = async (orderId) => {
        setIsLoadingUnAssignExec(true);
        await onUnAssignExecutor(orderId);
        setIsLoadingUnAssignExec(false);
        setError(null);
    }

    const handleAssignExecutor = async (e) => {

        const numericPrice = Number(finalPrice);
        const numericFinalDays = Number(finalDays);

        if (!numericPrice || !numericFinalDays || !bidId) {
            setError(t('error_message.fields_empty'));
            return;
        }

        if (numericPrice <= 0 || !Number.isInteger(numericPrice)) {
            setError(t('error_message.price_abs'));
            return;
        }

        if (numericFinalDays <= 0 || !Number.isInteger(numericFinalDays)) {
            setError(t('error_message.term_abs'));
            return;
        }
        setIsLoadingAssignExec(true);
        await onAssignExecutor(bidId, finalPrice, finalDays);


        setConfirmingBidId(null);
        setFinalPrice(order.price);
        setFinalDays(1);
        setError(null);


        setIsLoadingAssignExec(false);
    }

    return (

        <div className={`${styles.BidContainer} ${order.executor === author.id ? styles.selected : order.selected_bid === bid.id ? styles.offerSend : ''
            }`}>
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    <span className={`${styles.statusBadge} ${styles[verificationStatus]}`}>
                        {verificationStatus}
                    </span>
                    <Link to={`/profile/${author.id}/`} className={styles.authorLink}>
                        {author.username} {isUserBid && <span className={styles.meTag}>({t('general.you')})</span>}
                    </Link>

                    {order.executor?.id === author.id ? (
                        <span className={styles.ExecutorBadge}>{t('general.selected')}</span>
                    ) : order.selected_bid === bid.id && (
                        <span className={styles.SelectedBidBadge}>{t('general.offer_send')}</span>
                    )}
                </div>

                <div className={styles.bidMetrics}>
                    <div className={styles.metric}>
                        <span className={styles.label}>{t('bids.price')}</span>
                        <span className={styles.value}>{bid.price} EUR</span>
                    </div>
                    <div className={styles.metric}>
                        <span className={styles.label}>{t('bids.term')}</span>
                        <span className={styles.value}>{bid.days_to_complete} {t('bids.day')}</span>
                    </div>
                </div>
            </div>

            <div className={styles.Description}>
                <p>{bid.description}</p>
            </div>

            <div className={styles.actions}>
                {isAuthor && orderStatus === "open" && (
                    <div className={styles.assignZone}>
                        {confirmingBidId === null ? (
                            <button className={styles.AssignBtn}
                                onClick={() => setConfirmingBidId(bidId)}>{t('order_message.assign_executor')}</button>
                        ) : (confirmingBidId === bidId && (
                            <div className={styles.BidAssignForm}>
                                <h3>{t('general.final_offer')}</h3>

                                <form onSubmit={(e) => e.preventDefault()}>
                                    <div className={styles.inputRow}>


                                        <input
                                            type="number"
                                            placeholder={`${t('bids.price')} (EUR)`}
                                            value={finalPrice}
                                            onChange={(e) => setFinalPrice(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder={`${t('bids.term')} (${t('bids.day')})`}
                                            value={finalDays}
                                            onChange={(e) => setFinalDays(e.target.value)}
                                        />


                                    </div>

                                    <div className={styles.formButtons}>
                                        <ActionConfirm
                                            buttonClass={`${styles.ConfirmOffer} ${isLoadingAssignExec && styles.disabledBtn}`}
                                            labelName={isLoadingAssignExec ? (
                                                <div className="g-loading-info">
                                                    <p>{t('load.assign')}</p>
                                                    <span className="dots">
                                                        <span>.</span><span>.</span><span>.</span>
                                                    </span>
                                                </div>
                                            ) : t('order_message.accept_send')}
                                            confirmMessage={t('order_message.confirm_send')}
                                            onConfirm={handleAssignExecutor} />

                                        <button className={styles.CancelBtn} type="button" onClick={() => {
                                            setConfirmingBidId(null);
                                            setError(null);
                                        }}>
                                            {t('general.cancel')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.orderBlock}>
                    {isAuthor && orderStatus === "pending" && order.selected_bid === bidId && (

                        <ActionConfirm
                            buttonClass={`${styles.DeclineOffer} ${isLoadingUnAssignExec && styles.disabledBtn}`}
                            labelName={isLoadingUnAssignExec ? (
                                <div className="g-loading-info">
                                    <p>{t('load.unassign')}</p>
                                    <span className="dots">
                                        <span>.</span><span>.</span><span>.</span>
                                    </span>
                                </div>
                            ) : t('order_message.decline_choice')}
                            confirmMessage={t('order_message.confirm_decline_offer')}
                            onConfirm={() => handleUnAssignExecutor(order.id)} />
                    )}

                    {order.selected_bid && (isAuthor || userBidId === bidId) && (
                        <Link to={`/chats/${order.chatId}`} className={styles.chatButton}>
                            {t('orders.chat_with')} {isAuthor ? t('orders.with_executor') : t('orders.with_customer')}
                        </Link>
                    )}

                    {userBidId === bidId && (
                        <div className={styles.deleteZone}>
                            {(orderStatus === "open") ? (
                                <ActionConfirm
                                    labelName={isLoadingDelBid ? (
                                        <div className="g-loading-info">
                                            <p>{t('load.delete')}</p>
                                            <span className="dots">
                                                <span>.</span><span>.</span><span>.</span>
                                            </span>
                                        </div>
                                    ) : t('general.delete')}
                                    confirmMessage={t('bids.confirm_delete')}
                                    buttonClass={`${styles.deleteBtn} ${isLoadingDelBid && styles.disabledBtn}`}
                                    onConfirm={() => handleDeleteBid(bidId)}
                                />
                            ) : (
                                <p className={styles.lockText}>{t('error_message.order_approved_bid')}</p>
                            )}
                        </div>

                    )}

                </div>

                {error && (
                    <div className={styles.ErrorMessage}>{error}</div>
                )}
            </div>

        </div>
    )
}