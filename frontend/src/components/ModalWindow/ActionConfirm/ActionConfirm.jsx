import styles from "./ActionConfirm.module.css"
import ReactDOM from 'react-dom';
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ActionConfirm({ labelName, confirmMessage, buttonClass, onConfirm }) {
    
    const { t } = useTranslation();

    const [isOpen, setIsOpen] = useState(false);

    const handleConfirm = () => {
        setIsOpen(false);
        onConfirm();
    }

    const handleClick = (e) => {
        e.stopPropagation();
        setIsOpen(true)
    }
    return (
        <>
            <button className={buttonClass} onClick={(e) => handleClick(e)}>
                {labelName}
            </button>

            {isOpen && ReactDOM.createPortal(
                <div className={styles.overlay} onClick={() => setIsOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3>{t('general.confirmation')}</h3>
                        <p>{confirmMessage}</p>

                        <div className={styles.actions}>
                            <button className={styles.acceptBtn} onClick={() => handleConfirm()}>
                                {t('general.confirm')}
                            </button>

                            <button className={styles.declineBtn} onClick={() => setIsOpen(false)}>
                                {t('general.cancel')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}