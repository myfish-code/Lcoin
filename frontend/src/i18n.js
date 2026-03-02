import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Импортируем твои файлы (проверь пути!)
import ruTranslation from './locales/ru.json';
import skTranslation from './locales/sk.json';
import enTranslation from './locales/en.json';
import ukTranslation from './locales/uk.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ruTranslation },
      sk: { translation: skTranslation },
      en: { translation: enTranslation},
      uk: { translation: ukTranslation}
    },
    lng: localStorage.getItem("language") || 'sk', 
    fallbackLng: 'sk', 
    interpolation: { escapeValue: false }
  });

export default i18n;