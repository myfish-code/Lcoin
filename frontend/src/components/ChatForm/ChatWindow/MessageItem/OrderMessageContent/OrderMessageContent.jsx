import { useState } from "react";
import ActionConfirm from "../../../../ModalWindow/ActionConfirm/ActionConfirm";
import styles from "./OrderMessageContent.module.css"
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";


const getTimeRemaining = (deadline, t) => {

    const total = Date.parse(deadline) - Date.parse(new Date());

    if (total <= 0) {
        return "Срок истек"
    }

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor(total / (1000 * 60 * 60) % 24);

    if (days > 0) {
        return `${t('order_message.remain')}: ${days} ${t('order_message.day')} ${hours} ${t('order_message.hour')}`;
    }
    return `${t('order_message.remain')}: ${hours} ${t('order_message.hour')}`;
}

const ReviewForm = ({ onSubmit }) => {
    const { t } = useTranslation();

    const [isLoadingReview, setIsLoadingReview] = useState(false);

    const [text, setText] = useState("");
    const [rating, setRating] = useState(5);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        setError(null);
        const cleanText = text.trim();
        if (!cleanText) {
            setError(t('error_message.review_empty'));
            return;
        }

        if (cleanText.length > 100) {
            setError(t('error_message.review_max_char'));
            return;
        }

        const validRatings = [1, 2, 3, 4, 5];

        if (!validRatings.includes(Number(rating))) {
            setError(t('error_message.grade_condition'));
            setRating(5);
            return;
        }

        setIsLoadingReview(true);
        await onSubmit(cleanText, rating);
        setIsLoadingReview(false)

    }

    const handleChangeRating = (e) => {
        const inputValue = e.target.value;
        if (inputValue === "") {
            setRating("");
            return;
        }

        const num = Number(inputValue);
        const validRatings = [1, 2, 3, 4, 5];

        if (validRatings.includes(num)) {
            setRating(num);
        } else {
            setRating(5);
        }

    }

    const handleChangeText = (e) => {
        const value = e.target.value;
        if (value.length <= 100) {
            setText(e.target.value);
        }
    }

    return (
        <form
            onSubmit={(e) => e.preventDefault()}
            className={styles.ReviewForm}
        >
            <div className={styles.inputGroup}>
                <textarea
                    required
                    value={text}
                    placeholder={`${t('reviews.your_review')}...`}
                    onChange={(e) => handleChangeText(e)}
                ></textarea>
                <span>{text.length}/100</span>
            </div>

            <div className={styles.inputGroup}>
                <label>{t('reviews.grade')}(1-5)</label>
                <input
                    required
                    type="number"
                    value={rating}
                    onChange={(e) => handleChangeRating(e)} />
            </div>

            <ActionConfirm
                labelName={isLoadingReview ? (
                    <div className="g-loading-info">
                        <p>{t('load.send')}</p>
                        <span className="dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </div>
                ) : t('reviews.send')}
                buttonClass={`${styles.SendReviewBtn } ${isLoadingReview && styles.disabledBtn}`}
                confirmMessage={t('reviews.confirm_send')}
                onConfirm={handleSubmit} />

            {error && (
                <div className={styles.ErrorMessage}>{error}</div>
            )}
        </form>
    )
}

export default function OrderMessageContent({ isMe, messageType, message, onSubmitReview,
    onAcceptOffer, onDeclineOffer,
    onOpenDispute,
    onConfirmOrder }) {

    const { t } = useTranslation();

    const MESSAGE_CONFIG = {
        offer: {
            label: t('order_message.label_offer'),
            icon: '✉️',
            author: t('order_message.text_author_offer'),
            opponent: t('order_message.text_opponent_offer')
        },
        offer_accepted: {
            label: t('order_message.label_accept'),
            icon: '✅',
            author: t('order_message.text_author_accept'),
            opponent: t('order_message.text_opponent_accept')
        },
        offer_declined: {
            label: t('order_message.label_decline'),
            icon: '❌',
            author: t('order_message.text_author_decline'),
            opponent: t('order_message.text_opponent_decline')
        },
        dispute: {
            label: t('order_message.label_dispute'),
            icon: '⚖️',
            author: t('order_message.text_author_dispute'),
            opponent: t('order_message.text_opponent_dispute')
        },
        order_completed: {
            label: t('order_message.label_completed'),
            icon: '🎉',
            author: t('order_message.text_author_completed'),
            opponent: t('order_message.text_opponent_completed')
        }
    };

    const [isLoadingAccept, setIsLoadingAccept] = useState(false);
    const [isLoadingDecline, setIsLoadingDecline] = useState(false);

    const [isLoadingDispute, setIsLoadingDispute] = useState(false);

    const [isLoadingConfirm, setIsLoadingConfirm] = useState(false);

    const conditionDisabled = isLoadingAccept || isLoadingDecline || isLoadingDispute || isLoadingConfirm;

    const [isOpenReview, setIsOpenReview] = useState(false);

    const config = MESSAGE_CONFIG[messageType];
    const infoText = config ? (isMe ? config.author : config.opponent) : "";

    const order = message.order
    const orderId = order.id
    const messageId = message.id

    const reviews = message.review_data;
    const myReview = reviews.my_review;
    const opponentReview = reviews.opponent_review;

    const isExpired = Date.parse(order.expectedFinish) <= Date.parse(new Date());

    const handleAcceptOffer = async (orderId, messageId) => {
        setIsLoadingAccept(true);
        await onAcceptOffer(orderId, messageId)
        setIsLoadingAccept(false);
    }
    const handleDeclineOffer = async (orderId, messageId) => {
        setIsLoadingDecline(true);
        await onDeclineOffer(orderId, messageId);
        setIsLoadingDecline(false);
    }
    const handleOpenDispute = async (orderId, messageId) => {
        setIsLoadingDispute(true);
        await onOpenDispute(orderId, messageId);
        setIsLoadingDispute(false);
    }
    const handleConfirmCompleted = async (orderId, messageId) => {
        setIsLoadingConfirm(true);
        await onConfirmOrder(orderId, messageId);
        setIsLoadingConfirm(false)
    }

    return (
        <div className={`${styles[messageType]}`}>

            <div className={styles.TextContent}>
                <div className={styles.Header}>
                    <label className={styles.Label}>{config.label}</label>
                    <span className={styles.icon}>{config.icon}</span>
                </div>

                <div className={styles.OrderMeta}>
                    <span className={styles.OrderId}>{t('orders.id_message')}: </span>
                    <Link to={`/search/${order.id}`}>{order.id}</Link>
                </div>

                <p className={styles.OrderInfo}>{infoText}</p>

                <div className={styles.FinalCondition}>
                    <span className={styles.Price}>{t('general.final_price')}: {message.final_price} EUR</span>
                    <span className={styles.Days}>{t('general.final_term')}: {message.final_days} {t('order_message.day')}</span>
                </div>
                {messageType === "offer_accepted" && order.expectedFinish && (
                    <div className={`${styles.TimeRemain} ${isExpired ? styles.TimeExpired : ''}`}>
                        <span className={styles.Icon}>{isExpired ? "⚠️" : "⏳"}</span>
                        {getTimeRemaining(order.expectedFinish, t)}
                    </div>
                )}
                {messageType === "dispute" && (
                    <Link to={`/myDisputes/${order.disputeId}`} className={styles.disputeBtn}>
                        {t('disputes.watch_chat')}
                    </Link>
                )}

                {messageType === "order_completed" && reviews && (
                    <div className={styles.ReviewField}>
                        {myReview ? (
                            <div className={styles.Review}>
                                <span>{t('reviews.your_review')}:</span>
                                <span>{t('reviews.grade')}: {myReview.grade} ⭐</span>
                                <p>{t('reviews.about_work')}: {myReview.text}</p>
                            </div>
                        ) : (
                            <div className={styles.ReviewEmpty}>
                                <p>{isMe ? t('reviews.your_review_empty') : t('reviews.executor_empty')}</p>
                            </div>
                        )}

                        {opponentReview ? (
                            <div className={styles.Review}>
                                <span>{isMe ? t('reviews.text_executor') : t('reviews.text_customer')}</span>
                                <span>{t('reviews.grade')}: {opponentReview.grade} ⭐</span>
                                <p>{t('reviews.about_work')}: {opponentReview.text}</p>
                            </div>
                        ) : (
                            <div className={styles.ReviewEmpty}>
                                <p>{isMe ? t('reviews.executor_empty') : t('reviews.customer_empty')}</p>
                            </div>
                        )}
                    </div>
                )}

            </div>

            <div className={styles.OptionBtns}>

                {messageType === "offer" && !isMe && (
                    <>
                        <ActionConfirm
                            labelName={isLoadingAccept ? (
                                <div className="g-loading-info">
                                    <p>{t('load.accept')}</p>
                                    <span className="dots">
                                        <span>.</span><span>.</span><span>.</span>
                                    </span>
                                </div>
                            ) : t('general.accept')}
                            buttonClass={`${styles.acceptOfferBtn} ${conditionDisabled && styles.disabledBtn}`}
                            confirmMessage={t('order_message.confirm_accept')}
                            onConfirm={() => handleAcceptOffer(orderId, messageId)} />

                        <ActionConfirm
                            labelName={isLoadingDecline ? (
                                <div className="g-loading-info">
                                    <p>{t('load.decline')}</p>
                                    <span className="dots">
                                        <span>.</span><span>.</span><span>.</span>
                                    </span>
                                </div>
                            ) : t('general.decline')}
                            buttonClass={`${styles.declineOfferBtn} ${conditionDisabled && styles.disabledBtn}`}
                            confirmMessage={t('order_message.confirm_decline')}
                            onConfirm={() => handleDeclineOffer(orderId, messageId)} />
                    </>
                )}

                {messageType === "offer_accepted" && (
                    <>
                        {isMe &&
                            <ActionConfirm
                                labelName={isLoadingConfirm ? (
                                    <div className="g-loading-info">
                                        <p>{t('load.confirm')}</p>
                                        <span className="dots">
                                            <span>.</span><span>.</span><span>.</span>
                                        </span>
                                    </div>
                                ) : t('order_message.complete_text')}
                                buttonClass={`${styles.confirmCompletedBtn} ${conditionDisabled && styles.disabledBtn}`}
                                confirmMessage={t('order_message.confirm_complete')}
                                onConfirm={() => handleConfirmCompleted(orderId, messageId)} />}

                        <ActionConfirm
                            labelName={isLoadingDispute ? (
                                <div className="g-loading-info">
                                    <p>{t('load.dispute')}</p>
                                    <span className="dots">
                                        <span>.</span><span>.</span><span>.</span>
                                    </span>
                                </div>
                            ) : t('order_message.open_dispute')}
                            buttonClass={`${styles.disputeBtn} ${conditionDisabled && styles.disabledBtn}`}
                            confirmMessage={t('order_message.confirm_dispute')}
                            onConfirm={() => handleOpenDispute(orderId, messageId)} />
                    </>
                )}

                {messageType === "order_completed" && !myReview && (
                    <div className={styles.ReviewSection}>
                        <button
                            className={`${isOpenReview ? styles.CancelReviewBtn : styles.StartReviewBtn}`}
                            onClick={() => setIsOpenReview(!isOpenReview)}>
                            {isOpenReview ? t('order_message.cancel') : t('order_message.put_review')}
                        </button>

                        {isOpenReview && (
                            <ReviewForm onSubmit={(text, rating) => onSubmitReview(orderId, messageId, text, rating)} />
                        )}
                    </div>
                )}
            </div>

        </div>
    )
}

