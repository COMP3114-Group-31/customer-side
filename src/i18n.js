import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

const savedLocale =
  (typeof localStorage !== 'undefined' && localStorage.getItem('locale')) ||
  (typeof document !== 'undefined' && document.documentElement?.lang) ||
  'en'

const messages = {
  en,
  'zh-CN': zhCN
}

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages,
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLocale
}

export default i18n
