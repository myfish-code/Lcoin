import styles from "./LoginForm.module.css"

import { Link } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from 'lucide-react';

import { useTranslation } from "react-i18next";
import LanguageBar from "../../LanguageBar/LanguageBar";

export default function LoginForm({ onSubmit }) {

    const { t } = useTranslation();

    const [showPassword, setShowPassword] = useState(false);

    const [loginValue, setLogin] = useState("");
    const [passwordValue, setPassword] = useState("");

    const [error, setError] = useState({
        username: null,
        password: null,
        submitBtn: null
    });

    let lang = localStorage.getItem("language") || "sk";

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError({ username: null, password: null, submitBtn: null });
        if (!loginValue) {
            setError(prev => ({
                ...prev,
                username: t('error_message.login_empty')
            }))
            return;
        }

        if (loginValue.length > 20) {
            setError(prev => ({
                ...prev,
                username: t('error_message.login_max_char')
            }))
            return;
        }

        if (!passwordValue) {
            setError(prev => ({
                ...prev,
                password: t('error_message.password_empty')
            }))
            return;
        }

        const dataError = await onSubmit({ loginValue, passwordValue, language: lang });

        if (dataError) {
            setError(prev => ({
                ...prev,
                submitBtn: t(`error_message.${dataError}`)
            }))
        } else {
            setError({ username: null, password: null, submitBtn: null });
        }

    }

    const handleChangeLogin = (e) => {
        const value = e.target.value;
        if (value.length <= 20) {
            setLogin(e.target.value);
        }
    }

    return (
        <div className={styles.Wrapper}>
            <form className={styles.LoginForm} onSubmit={handleSubmit}>
                <LanguageBar lang={lang}/>
                <h2>{t('login.text_general')}</h2>

                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        name="username"
                        value={loginValue}
                        placeholder="Login"
                        maxLength={20}
                        onChange={(e) => handleChangeLogin(e)}
                    />
                    <span>{loginValue.length}/20</span>

                    {error.username && (
                        <p className={styles.ErrorView}>{error.username}</p>
                    )}
                </div>

                <div className={styles.inputWrapper}>
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={passwordValue}
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff /> : <Eye />}
                    </button>

                    {error.password && (
                        <p className={styles.ErrorView}>{error.password}</p>
                    )}
                </div>


                <button className={styles.submitBtn} type="submit">
                    {t('login.text_general1')}
                </button>

                {error.submitBtn && (
                    <p className={styles.ErrorView}>{error.submitBtn}</p>
                )}

                <div className={styles.AuthNavigation}>
                    <span>{t('login.no_account')}</span>
                    <Link to="/register" className={styles.AuthLink}>{t('login.register')}</Link>
                </div>

            </form>
        </div>

    );
}
