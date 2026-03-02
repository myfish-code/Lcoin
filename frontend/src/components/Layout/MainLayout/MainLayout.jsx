import { useNavigate, Link, Outlet, Navigate } from "react-router-dom";
import { useState, useEffect, lazy } from "react";
import { useTranslation } from "react-i18next";

import styles from "./MainLayout.module.css"
import ActionConfirm from "../../ModalWindow/ActionConfirm/ActionConfirm";
import FeedBackInfo from "../../ModalWindow/FeedBackInfo/FeedBackInfo";
import { getLanguage } from "../../../api/users";

export default function MainLayout() {
    const navigate = useNavigate();

    const { t, i18n } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const access = localStorage.getItem("access");
    const user = localStorage.getItem("user");

    if (!access || !user) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        return <Navigate to="/login" replace />
    }

    const toggleMenu = (() => setIsMenuOpen(!isMenuOpen));
    const closeMenu = (() => setIsMenuOpen(false));

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        navigate("/login");
    }

    useEffect(() => {
        if (!user || !access) {
            handleLogout();
        } else {
            getLanguage().then((data) => {
                const language = data.language
                localStorage.setItem("language", language)
                i18n.changeLanguage(language);
            })
        }
    }, []);

    return (
        <div className={styles.MainLayout}>

            <header className={styles.Header}>
                <div className={styles.HeaderContainer}>
                    <div className={styles.Logo}>UniversityApp</div>

                    <FeedBackInfo
                        buttonText={`💬 ${t('feedback.support')}`}
                        buttonClass={styles.headerFeedBackButton} />

                    <div className={`${styles.Burger} ${isMenuOpen ? styles.Active : ""}`} onClick={toggleMenu}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                </div>

                <nav className={`${styles.Nav} ${isMenuOpen ? styles.NavOpen : ""}`}>
                    <Link to={`/search?page=1`} className={styles.MenuBtn} onClick={closeMenu}>🔎{t('mainlayout.search_orders')}</Link>
                    <Link to={`/chats`} className={styles.MenuBtn} onClick={closeMenu}>💬{t('mainlayout.messages')}</Link>
                    <Link to={`/myOrders?page=1&status=open`} className={styles.MenuBtn} onClick={closeMenu}>📝{t('mainlayout.my_orders')}</Link>
                    <Link to={`/myBids?page=1&status=pending`} className={styles.MenuBtn} onClick={closeMenu}>🏇{t('mainlayout.my_bids')}</Link>
                    <Link to={`/myDisputes?page=1&status=open`} className={styles.MenuBtn} onClick={closeMenu}>😡{t('mainlayout.my_disputes')}</Link>
                    <Link to="/profile/me?page=1&role=executor" className={styles.MenuBtn} onClick={closeMenu}>🪪{t('mainlayout.profile')}</Link>

                    <FeedBackInfo
                        buttonText={`💬 ${t('feedback.support')}`}
                        buttonClass={styles.navFeedBackButton} />

                    <ActionConfirm
                        labelName={`🚪 ${t('mainlayout.logout')}`}
                        confirmMessage={t('mainlayout.confirm_logout')}
                        buttonClass={styles.LogoutBtn}
                        onConfirm={handleLogout}
                    />

                </nav>

            </header>

            <main className={styles.MainContent}>
                <Outlet />
            </main>

        </div>
    )
}