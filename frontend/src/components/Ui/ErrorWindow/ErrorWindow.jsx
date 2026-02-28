import { useState, useEffect } from "react";
import styles from "./ErrorWindow.module.css"

import ReactDOM from 'react-dom';
import { useTranslation } from "react-i18next"
import FeedBackInfo from "../../ModalWindow/FeedBackInfo/FeedBackInfo";

export default function ErrorWindow({ error }) {
    const { t } = useTranslation();
    const [showWindow, setShowWindow] = useState(true);

    const handleRefresh = () => {
        window.location.reload();
    }

    useEffect(() => {
        if (error) {
            setShowWindow(true);
        }
    }, [error]);
    

    if (!showWindow) {
        return null;
    }

    return (

        ReactDOM.createPortal(
            <div className={styles.ErrorWindowContainer}>

                <div className={styles.header}>
                    <h3>{t('error_message.window_general')}</h3>
                    <span onClick={() => setShowWindow(false)}>❌</span>
                </div>

                <div className={styles.content}>
                    <span className={styles.ErrorMessage}>
                        {t(`${error.message}`)}
                    </span>

                    <p className={styles.hint}>
                        {t('error_message.refresh_hint')}
                    </p>

                    <button className={styles.refreshBtn} onClick={handleRefresh}>
                        {t('error_message.refresh')}
                    </button>
                    
                    <FeedBackInfo buttonText={t('feedback.general')} buttonClass={styles.FeedBackBtn}/>
                </div>

            </div>,
            document.body
        ))

}