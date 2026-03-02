import styles from "./Home.module.css"

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import LanguageBar from "../../components/LanguageBar/LanguageBar";

export default function Home() {
    const { t } = useTranslation();
    let lang = localStorage.getItem("language") || "sk";

    return (
        <div className={styles.HomeContainer}>
            <LanguageBar lang={lang}/>
            
            <div className={styles.header}>
                <h1>{t('home.header')}</h1>
                <p>{t('home.header_text')}</p>

                <div className={styles.actionsBtn}>
                    <Link to="/register">{t('home.register')}</Link>
                    <Link to="/login">{t('home.login')}</Link>
                </div>
            </div>

            <div className={styles.how_works}>
                <div className={styles.step}>
                    <h3>{t('home.subject_1')}</h3>
                    <p>{t('home.text_1')}</p>
                </div>
                <div className={styles.step}>
                    <h3>{t('home.subject_2')}</h3>
                    <p>{t('home.text_2')}</p>
                </div>
                <div className={styles.step}>
                    <h3>{t('home.subject_3')}</h3>
                    <p>{t('home.text_3')}</p>
                </div>
            </div>
        </div>
    );
}