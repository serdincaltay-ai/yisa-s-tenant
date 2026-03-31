/**
 * i18n yapılandırması — next-intl
 * Desteklenen diller ve varsayılan dil ayarları.
 */

export const locales = ['tr', 'en', 'ru'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'tr'

export const localeNames: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  ru: 'Русский',
}
