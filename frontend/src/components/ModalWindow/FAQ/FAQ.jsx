import { useState } from "react"
import styles from "./FAQ.module.css"
import { useTranslation } from "react-i18next";

import ReactDOM from 'react-dom';

export default function FAQ() {
    const { t } = useTranslation();

    const [isOpen, setIsOpen] = useState(false);

    const handleClick = (e) => {
        e.stopPropagation();
        setIsOpen(true)
    }

    return (
        <>
            <button className={styles.buttonFAQ} onClick={(e) => handleClick(e)}>
                {t('FAQ.button')}
            </button>

            {isOpen && ReactDOM.createPortal(
                <div className={styles.overlay} onClick={() => setIsOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.header}>
                            <h3>{t('FAQ.header')}</h3>
                            <span onClick={() => setIsOpen(false)}>❌</span>
                        </div>
                        <div className={styles.MainContent}>
                            <h2 className={styles.faqMainTitle}>{t('FAQ.how_works')}</h2>

                            <section className={styles.faqSection}>
                                <h3 className={styles.sectionHeader}>📦 {t('FAQ.order_works')}</h3>
                                <div className={styles.textBlock}>
                                    <p>{t('FAQ.order_1')} <strong>"{t('mainlayout.my_orders')}"</strong>. {t('FAQ.order_2')}</p>
                                    <div className={styles.statusGroup}>
                                        <p className={styles.groupTitle}>{t('FAQ.status_order')}:</p>
                                        <ul className={styles.statusList}>
                                            <li><span className={styles.badgeOpenOrder}>OPEN</span> - {t('FAQ.status_order_open')}</li>
                                            <li><span className={styles.badgePendingOrder}>PENDING</span> - {t('FAQ.status_order_pending')}</li>
                                            <li><span className={styles.badgeProgress}>IN PROGRESS</span> - {t('FAQ.status_order_progress')}</li>
                                            <li><span className={styles.badgeDispute}>DISPUTE</span> - {t('FAQ.status_order_dispute')}</li>
                                            <li><span className={styles.badgeCompleted}>COMPLETED</span> - {t('FAQ.status_order_completed')}</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section className={styles.faqSection}>
                                <h3 className={styles.sectionHeader}>🚀 {t('FAQ.bid_works')}</h3>
                                <div className={styles.textBlock}>
                                    <p> {t('FAQ.bid_1')} <strong>"{t('mainlayout.search_orders')}"</strong>. {t('FAQ.bid_2')}</p>
                                    <div className={styles.statusGroup}>
                                        <p className={styles.groupTitle}>{t('FAQ.status_bids')}:</p>
                                        <ul className={styles.statusList}>
                                            <li><span className={styles.badgePendingBid}>PENDING</span> - {t('FAQ.status_bid_pending')}</li>
                                            <li><span className={styles.badgeOfferBid}>OFFER</span> - {t('FAQ.status_bid_offer')}</li>
                                            <li><span className={styles.badgeProgress}>IN PROGRESS</span> - {t('FAQ.status_bid_progress')}</li>
                                            <li><span className={styles.badgeDispute}>DISPUTE</span> - {t('FAQ.status_bid_dispute')}</li>
                                            <li><span className={styles.badgeCompleted}>COMPLETED</span> - {t('FAQ.status_bid_completed')}</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section className={styles.faqSection}>
                                <h3 className={styles.sectionHeader}>👤 {t('FAQ.profile_and_chat')}</h3>
                                <div className={styles.textBlock}>
                                    <p>
                                        <strong>{t('FAQ.profile_user')}:</strong> {t('FAQ.profile_info_1')} <strong>{t('FAQ.executor')}</strong> {t('FAQ.and')} <strong>{t('FAQ.customer')}</strong>. {t('FAQ.profile_info_2')}
                                    </p>

                                    <div className={styles.statusGroup}>
                                        <p className={styles.groupTitle}>{t('FAQ.status_verification')}:</p>
                                        <p className={styles.privacyNote}>{t('FAQ.verification_anonym')}</p>
                                        <ul className={styles.statusList}>
                                            <li><span className={styles.badgeUnverifiedVerify}>UNVERIFIED</span> — {t('FAQ.verify_unverified')}.</li>
                                            <li><span className={styles.badgePendingVerify}>PENDING</span> — {t('FAQ.verify_pending')}.</li>
                                            <li><span className={styles.badgeVerifiedVerify}>VERIFIED</span> — {t('FAQ.verify_verified')}.</li>
                                            <li><span className={styles.badgeRejectedVerify}>REJECTED</span> — {t('FAQ.verify_rejected')}.</li>
                                        </ul>
                                    </div>

                                    <div className={styles.navInfo}>
                                        <p>
                                            <strong>{t('FAQ.chat_on_platform')}:</strong> {t('FAQ.chat_text_1')} <strong>Username</strong> {t('FAQ.chat_text_2')}.
                                        </p>
                                        <p>
                                            {t('FAQ.chat_text_3')} <strong>"{t('profile.write_message')}"</strong>. {t('FAQ.chat_text_4')}
                                        </p>
                                        <p className={styles.activeChatsNote}>
                                            {t('FAQ.chat_text_5')} <strong>{t('mainlayout.messages')}</strong>
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>, document.body
            )}
        </>
    )
}