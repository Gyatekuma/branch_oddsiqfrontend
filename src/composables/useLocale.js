import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export function useLocale() {
  const { locale, availableLocales, t } = useI18n()

  const currentLocale = computed(() => locale.value)

  const locales = computed(() => [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ])

  const currentLocaleInfo = computed(() => {
    return locales.value.find(l => l.code === locale.value) || locales.value[0]
  })

  function setLocale(code) {
    if (availableLocales.includes(code)) {
      locale.value = code
      localStorage.setItem('locale', code)
      document.documentElement.lang = code
    }
  }

  function toggleLocale() {
    const newLocale = locale.value === 'en' ? 'fr' : 'en'
    setLocale(newLocale)
  }

  // Sync locale with HTML lang attribute
  watch(locale, (newLocale) => {
    document.documentElement.lang = newLocale
  }, { immediate: true })

  // Format date according to locale
  // Assumes backend sends UTC times without Z suffix
  function formatDate(date, options = {}) {
    if (!date) return '-'

    // If date string doesn't have timezone info, treat as UTC
    let dateStr = date
    if (typeof date === 'string' && !date.includes('Z') && !date.includes('+') && !date.includes('-', 10)) {
      dateStr = date + 'Z'  // Append Z to indicate UTC
    }

    const parsed = new Date(dateStr)
    if (isNaN(parsed.getTime())) return '-'

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    return new Intl.DateTimeFormat(locale.value, { ...defaultOptions, ...options }).format(parsed)
  }

  // Format time according to locale
  // Assumes backend sends UTC times without Z suffix
  function formatTime(date) {
    if (!date) return '-'

    // If date string doesn't have timezone info, treat as UTC
    let dateStr = date
    if (typeof date === 'string' && !date.includes('Z') && !date.includes('+') && !date.includes('-', 10)) {
      dateStr = date + 'Z'  // Append Z to indicate UTC
    }

    const parsed = new Date(dateStr)
    if (isNaN(parsed.getTime())) return '-'

    return new Intl.DateTimeFormat(locale.value, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone  // Use user's local timezone
    }).format(parsed)
  }

  // Format number according to locale
  function formatNumber(number, options = {}) {
    return new Intl.NumberFormat(locale.value, options).format(number)
  }

  // Format currency (GHS)
  function formatCurrency(amount) {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return {
    locale: currentLocale,
    locales,
    currentLocaleInfo,
    t,
    setLocale,
    toggleLocale,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency
  }
}
