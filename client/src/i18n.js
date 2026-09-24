import i18n from "i18next";
import { initReactI18next } from 'react-i18next';
import LanguageDetector from "i18next-browser-languagedetector"

import translationRu from "./locales/ru/translation.json";
import translationEn from "./locales/en/translation.json";

const resources = {
    ru: { translation: translationRu },
    en: { translation: translationEn },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'ru',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
