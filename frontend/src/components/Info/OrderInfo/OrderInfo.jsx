import { Link } from "react-router-dom"

import styles from "./OrderInfo.module.css"

import ActionConfirm from "../../ModalWindow/ActionConfirm/ActionConfirm";
import { useTranslation } from "react-i18next"
import { useState } from "react";


export default function OrderInfo({ order, isAuthor, onDeleteOrder }) {
    const { t } = useTranslation();

    const [isLoadingDel, setIsLoadingDel] = useState(false);

    const verificationStatus = order.author.verification_status || "unverified";

    const handleDeleteOrder = async(orderId) => {
        setIsLoadingDel(true);
        await onDeleteOrder(orderId);
        setIsLoadingDel(false);
    }

    const getFileName = (url) => {
        if (!url) return ['', ''];
        const decodedUrl = decodeURIComponent(url);
        const newUrl = decodedUrl.split('/').pop();
        const lastIndex = newUrl.lastIndexOf('.');

        if (lastIndex === -1) {
            return [newUrl, '']
        }

        return [newUrl.substring(0, lastIndex),
                newUrl.substring(lastIndex)]
    }

    return (
        <div className={styles.OrderContainer}>
            <div className={styles.header}>
                <h3 className={styles.title}>{order.name}</h3>
                <span className={`${styles.status} ${styles[order.status]}`}>
                    {order.status}
                </span>
            </div>

            <hr className={styles.divider} />


            <div className={styles.content}>
                <div className={styles.infoGroup}>
                    <label>{t('orders.description')}</label>
                    <p>{order.description}</p>
                </div>
                {order.order_file && (
                    <div className={styles.infoGroup}>
                        <label>{t('orders.file_received')}</label>
                        <div className={styles.fileGroup}>
                            <span>📎</span>
                            <a
                                href={order.order_file.replace("http://", "https://")}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className={styles.downloadBtn}
                            >
                                {(() => {
                                    const [start, end] = getFileName(order.order_file)
                                    return (
                                        <>
                                            <span className={styles.startFileName}>{start}</span>
                                            <span className={styles.endFileName}>{end}</span>
                                        </>
                                    )
                                })()} {/* Вызывает функцию */}

                            </a>
                        </div>
                    </div>
                )}

                <div className={styles.detailsGrid}>
                    <div className={styles.infoItem}>
                        <label>{t('orders.subject')}:</label>
                        <span>{order.subject}</span>
                    </div>

                    <div className={styles.infoItem}>
                        <label>{t('general.author')}:</label>
                        <Link to={`/profile/${order.author.id}`} className={styles.authorLink}>
                            {order.author.username} {isAuthor && (`(${t('general.you')})`)}
                        </Link>
                    </div>

                    <div className={styles.infoItem}>
                        <label>{t('profile.author_verify')}:</label>
                        <span className={`${styles.statusBadge} ${styles[verificationStatus]}`}>
                            {verificationStatus}
                        </span>
                    </div>


                    <div className={styles.infoItem}>
                        <label>{t('orders.price')}:</label>
                        <span className={styles.price}>{order.price} EUR</span>
                    </div>
                </div>
            </div>

            {
                isAuthor && (
                    <div className={styles.actions}>
                        {(order.status === "open" || order.status === "pending") ? (
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
                                onConfirm={() => handleDeleteOrder(order.id)}
                            />
                        ) : (
                            <div className={styles.warningBox}>
                                {t('error_message.order_approved')}
                            </div>
                        )}
                    </div>
                )
            }

        </div >
    )
}