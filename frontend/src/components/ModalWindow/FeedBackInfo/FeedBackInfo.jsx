import styles from "./FeedBackInfo.module.css"
import ReactDOM from 'react-dom';
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { sendFeedBackMessage } from "../../../api/users";

export default function FeedBackInfo({ buttonText, buttonClass }) {
    const [error, setError] = useState(null);

    const [isLoadingSend, setIsLoadingSend] = useState(false);

    const [isSuccess, setIsSuccess] = useState(false);

    const [isOpenForm, setIsOpenForm] = useState(false);
    const { t } = useTranslation();

    const [feedBackText, setFeedBackText] = useState("");

    const handleCloseForm = () => {
        setIsOpenForm(false);
        setIsSuccess(false);
        setFeedBackText("");
        setIsLoadingSend(false);
        setError(null);
    }

    const handleClick = (e) => {
        e.stopPropagation();
        setIsOpenForm(true);
    }

    const handleChangeText = (e) => {
        const value = e.target.value;
        if (value.length <= 300) {
            setFeedBackText(value);
            setError(null);
        }
    }

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        if (!feedBackText || feedBackText.length === 0) {
            setError(t('error_message.fields_empty'));
            return;
        }

        setIsLoadingSend(true);
        
        try {
            await sendFeedBackMessage(feedBackText);

            setIsSuccess(true);
            setFeedBackText("");
            setError(null);
            setTimeout(() => {
                setIsOpenForm(false);
                setIsSuccess(false);
            }, 3000);

        } catch (error) {
            setError(t(`error_message.${error.message}`))
        } finally {
            setIsLoadingSend(false);
        }
    }

    return (
        <>
            <button className={buttonClass} onClick={(e) => handleClick(e)}>
                {buttonText}
            </button>

            {isOpenForm && ReactDOM.createPortal(
                <div className={styles.overlay} onClick={() => handleCloseForm()}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.header}>
                            <h3>{t('feedback.general')}</h3>
                            <span onClick={() => handleCloseForm()}>❌</span>
                        </div>

                        <p className={styles.TextInfo}>{t('feedback.info_text')}</p>

                        {isSuccess ? (
                            <div className={styles.SuccessContent}>
                                <div className={styles.CheckIcon}>✔️</div>
                                <h3>{t('feedback.success_title')}</h3>
                                <p>{t('feedback.success_info')}</p>
                            </div>
                        ) : (
                            <form onSubmit={(e) => handleSubmitForm(e)}>
                                <div className={styles.inputGroup}>
                                    <textarea
                                        type="text"
                                        value={feedBackText}
                                        placeholder={t('feedback.placeholder')}
                                        onChange={(e) => handleChangeText(e)} />
                                    <span>{feedBackText.length}/300</span>
                                </div>

                                <button className={`${styles.submitBtn} ${isLoadingSend && styles.disabledBtn}`} type="submit">
                                    {isLoadingSend ? (
                                        <div className="g-loading-info">
                                            <p>{t('load.send')}</p>
                                            <span className="dots">
                                                <span>.</span><span>.</span><span>.</span>
                                            </span>
                                        </div>
                                    ) : t('feedback.send_button')}
                                </button>

                                {error && (
                                    <div className={styles.ErrorMessage}>{error}</div>
                                )}
                            </form>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}