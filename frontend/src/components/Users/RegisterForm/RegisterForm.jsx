import styles from "./RegisterForm.module.css"

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import LanguageBar from "../../LanguageBar/LanguageBar";
import googleIcon from "../../../assets/images/google_icon.png"

export default function RegisterForm({ onSubmit }) {
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(false);

    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    const [loginValue, setLogin] = useState("");
    const [passwordValue, setPassword] = useState("");
    const [password2Value, setPassword2] = useState("");

    const [error, setError] = useState({
        username: null,
        password: null,
        password2: null,
        submitBtn: null
    });

    let lang = localStorage.getItem("language") || "sk";

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError({
            username: null,
            password: null,
            password2: null,
            submitBtn: null
        })

        if (!loginValue) {
            setError(prev => ({ ...prev, username: t('error_message.login_empty') }))
            return;
        }

        if (loginValue.length > 20) {
            setError(prev => ({ ...prev, username: t('error_message.login_max_char') }))
            return;
        }

        if (!passwordValue) {
            setError(prev => ({ ...prev, password: t('error_message.password_empty') }))
            return;
        }

        if (!password2Value) {
            setError(prev => ({ ...prev, password2: t('error_message.password_empty') }))
            return;
        }

        if (password2Value !== passwordValue) {
            setError(prev => ({ ...prev, password2: t('error_message.password_no_match') }))
            return;
        }

        setIsLoading(true);
        const dataError = await onSubmit({ loginValue, passwordValue, password2Value, language: lang });
        setIsLoading(false);
        if (dataError) {
            setError(prev => ({ ...prev, submitBtn: t(`error_message.${dataError}`) }))
        } else {
            setError({
                username: null,
                password: null,
                password2: null,
                submitBtn: null
            })
        }
    }

    const handleChangeUsername = (e) => {
        const value = e.target.value;
        if (value.length <= 20) {
            setLogin(e.target.value);
        }
    }

    return (
        <div className={styles.Wrapper}>

            <form className={styles.RegisterForm} onSubmit={handleSubmit}>
                <LanguageBar lang={lang} />
                <h2>{t('register.text_general')}</h2>

                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        placeholder="username"
                        value={loginValue}
                        maxLength={20}
                        onChange={(e) => handleChangeUsername(e)}
                    />

                    <span>{loginValue.length}/20</span>
                    {error.username && (
                        <p className={styles.ErrorView}>{error.username}</p>
                    )}
                </div>

                <div className={styles.inputWrapper}>
                    <input
                        type={showPassword1 ? "text" : "password"}
                        placeholder="password"
                        value={passwordValue}
                        onChange={(e) => { setPassword(e.target.value) }}
                    />
                    <button type="button" onClick={() => setShowPassword1(!showPassword1)}>
                        {showPassword1 ? <EyeOff /> : <Eye />}
                    </button>
                    {error.password && (
                        <p className={styles.ErrorView}>{error.password}</p>
                    )}
                </div>

                <div className={styles.inputWrapper}>
                    <input
                        type={showPassword2 ? "text" : "password"}
                        placeholder="password2"
                        value={password2Value}
                        onChange={(e) => { setPassword2(e.target.value) }}
                    />
                    <button type="button" onClick={() => setShowPassword2(!showPassword2)}>
                        {showPassword2 ? <EyeOff /> : <Eye />}
                    </button>
                    {error.password2 && (
                        <p className={styles.ErrorView}>{error.password2}</p>
                    )}
                </div>

                <button className={`${styles.submitBtn} ${isLoading ? styles.disabledBtn : ''}`} type="submit">
                    {isLoading ? (
                        <div className="g-loading-info">
                            <p>{t('register.text_general')}</p>
                            <span className="dots">
                                <span>.</span><span>.</span><span>.</span>
                            </span>
                        </div>
                    ) : (
                        <div className={styles.registerText}>
                            <img
                                src={googleIcon}
                                width="18"
                                alt="Google"
                            />
                            {t('register.text_general1')}
                        </div>
                    )}
                </button>
                {error.submitBtn && (
                    <p className={styles.ErrorView}>{error.submitBtn}</p>
                )}

                <div className={styles.AuthNavigation}>
                    <span>{t('register.has_account')}</span>
                    <Link to="/login" className={styles.AuthLink}>{t('register.login')}</Link>
                </div>
            </form>
        </div>

    );
}