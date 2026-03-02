import styles from "./LanguageBar.module.css"

import { useTranslation } from "react-i18next"
import { useLayoutEffect, useState } from "react";

import enSvg from "../../assets/icons/flags/en.svg";
import ruSvg from "../../assets/icons/flags/ru.svg";
import ukSvg from "../../assets/icons/flags/uk.svg";
import skSvg from "../../assets/icons/flags/sk.svg";

export default function LanguageBar({lang="sk"}) {
    const { i18n } = useTranslation();

    const [currentLang, setCurrentLang] = useState(lang);

    const handleChangeLanguage = (lang_change) => {
        localStorage.setItem("language", lang_change)
        i18n.changeLanguage(lang_change);
        setCurrentLang(lang_change);
    }

    const languages = [
        {id: 1, code:"sk", icon: skSvg, label: "Slovenčina"},
        {id: 2, code:"en", icon: enSvg, label: "English"},
        {id: 3, code:"uk", icon: ukSvg, label: "Українська"},
        {id: 4, code:"ru", icon: ruSvg, label: "Русский"}
    ]

    return (
        <div className={styles.LanguageContainer}>
            {languages.map((lang) => (
                <div key={lang.id} 
                        className={`${styles.FlagItem} ${lang.code === currentLang ? styles.Active : ""}`} 
                        onClick={() => handleChangeLanguage(`${lang.code}`)}>
                            
                    <img src={`${lang.icon}`}
                        alt={`${lang.label}`}
                        className={styles.flag} />
                    <p>{lang.code}</p>
                </div>
            ))}
        </div>
    )
}