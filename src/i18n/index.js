import { createI18n } from 'vue-i18n'
import en from './en.json'
import fr from './fr.json'

const savedLocale = localStorage.getItem('locale')
const defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale || defaultLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    fr
  }
})

export default i18n
