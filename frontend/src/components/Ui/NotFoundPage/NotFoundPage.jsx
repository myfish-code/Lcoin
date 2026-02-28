import { useTranslation } from "react-i18next"
import styles from "./NotFountPage.module.css"
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    const goBack = () => {
        navigate(-1);
    }
    return (
        <div className={styles.EmptyPageContainer}>
            <h1 className={styles.ErrorCode}>404</h1>
            <h2 className={styles.Title}>{t('error_message.page_not_found')}</h2>
            <p className={styles.Description}>
                {t('error_message.page_not_found_desc')}
            </p>
            <button onClick={goBack} className={styles.BackButton}>
                {t('error_message.go_back')}
            </button>
        </div>
    )
}