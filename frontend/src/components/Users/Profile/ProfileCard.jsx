import styles from "./ProfileCard.module.css"

import { useState } from "react";
import { useTranslation } from "react-i18next";

import RadioChoice from "../../Ui/RadioChoice/RadioChoice"
import OrderCard from "../../Cards/OrderCard/OrderCard";

import Pagination from "../../Ui/Pagination/Pagination";
import Verification from "../../ModalWindow/Verification/Verification";
import ErrorWindow from "../../Ui/ErrorWindow/ErrorWindow";

export default function ProfileCard({ error, user, isOwner, orders, onCreateChat,
    currentRole, onTabChange,
    currentPage, maxPage, onPageChange,
    onApplyLangChange,
    onSubmitVerifyPhoto, isLoading }) {

    const { t } = useTranslation();

    const isExecutor = currentRole === "executor"
    const user_statistic = isExecutor ? user.executor_info : user.customer_info;
    const language = localStorage.getItem("language") || "sk"
    const verificationStatus = user.verification_status;
    const verifyRejectReason = user.verification_rejected_reason || t('verify.rejected_text_default');

    const [showProjects, setShowProjects] = useState(false);


    const [selectedLang, setSelectedLang] = useState(language);
    const [isOpenLangChange, setIsOpenLangChange] = useState(false);

    const handleChatButton = async () => {
        onCreateChat();
    }

    const choices = [
        { id: 1, status: "executor", text: t('profile.status_executor') },
        { id: 2, status: "customer", text: t('profile.status_customer') }
    ]

    const handleProfileTabChange = (tab) => {
        onTabChange(tab);
    }

    const handleApplyLang = () => {
        if (!selectedLang || selectedLang === language) {
            setIsOpenLangChange(false);
            setSelectedLang(language);
            return
        }

        onApplyLangChange(selectedLang);
        setIsOpenLangChange(false);

    }

    return (
        <div className={styles.ProfileContainer}>
            {error && (
                <ErrorWindow error={error} />
            )}
            <RadioChoice
                choices={choices}
                currentStatus={currentRole}
                onTabChange={handleProfileTabChange} />

            <div className={styles.ProfileInfo}>
                <h2>{t('profile.username')}: {user.username}</h2>
                {isOwner && (
                    <>
                        <ul className={styles.LangBtn} onClick={() => setIsOpenLangChange(!isOpenLangChange)}>{language}</ul>
                        {isOpenLangChange && (
                            <div className={styles.LangOptionsView}>
                                <select
                                    name="language"
                                    required
                                    value={selectedLang}
                                    onChange={(e) => setSelectedLang(e.target.value)}
                                >
                                    <option value="">-- {t('profile.selectLanguage')} --</option>
                                    <option value="sk">Slovenčina</option>
                                    <option value="en">English</option>
                                    <option value="uk">Українська</option>
                                    <option value="ru">Русский</option>
                                </select>
                                <button onClick={handleApplyLang}>{t('profile.apply')}</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className={styles.ProfileVerify}>
                <p className={styles.statusTitle}>{t('profile.status_title')}:</p>
                <span className={`${styles.statusBadge} ${styles[verificationStatus]}`}>
                    {verificationStatus}
                </span>
                {isOwner && (
                    verificationStatus === "unverified" ? <Verification onSubmit={onSubmitVerifyPhoto} /> :
                        verificationStatus === "pending" ? <p className={styles.pendingDescription}>
                            {t('verify.pending_text')}
                        </p> :
                            verificationStatus === "rejected" &&
                            <div>
                                <p className={styles.rejectedDescription}>
                                    {verifyRejectReason}
                                </p>
                                <Verification onSubmit={onSubmitVerifyPhoto} />
                            </div>
                )}
            </div>

            {user_statistic.total_reviews > 0 ? (
                <div className={styles.UserInfo}>
                    <h4>{isExecutor ? t('profile.role_executor') : t('profile.role_customer')}</h4>
                    <span className={styles.info}>⭐ {user_statistic.rating} - {t('profile.average_rating')}</span>
                    <span className={styles.info}>🚚 {user_statistic.total_reviews} - {t('profile.number_of_works')}</span>

                    <button
                        className={`${styles.ShowBtn} ${isLoading && styles.disabledBtn}`}
                        onClick={() => setShowProjects(!showProjects)}>
                        {isLoading ? (
                            <div className="g-loading-info">
                                <p>{t('load.works')}</p>
                                <span className="dots">
                                    <span>.</span><span>.</span><span>.</span>
                                </span>
                            </div>
                        ) : showProjects ? t('profile.hide_work') : t('profile.show_work')}
                    </button>
                </div>
            ) : (
                <div className={styles.CustomerEmpty}>
                    <h4>{isExecutor ? t('profile.role_executor') : t('profile.role_customer')}</h4>
                    <span>{isLoading ? (
                        <div className="g-loading-info">
                            <p>{t('load.works')}</p>
                            <span className="dots">
                                <span>.</span><span>.</span><span>.</span>
                            </span>
                        </div>
                    ) : t('profile.empty_work')}</span>
                </div>
            )}

            {!isOwner && (
                <button className={styles.ChatBtn} onClick={handleChatButton}>✉️ {t('profile.write_message')}</button>
            )}

            {showProjects && (
                <div className={styles.OrderView}>
                    {orders.map((order) => (
                        <OrderCard key={order.id} order={order} reviews={order.reviews_data} />
                    ))}

                    <Pagination
                        currentPage={currentPage}
                        maxPage={maxPage}
                        onPageChange={onPageChange} />
                </div>
            )}
        </div>
    )
}