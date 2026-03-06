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

                    </div>
                </div>, document.body
            )}
        </>
    )
}