'use client'

import { NextIntlClientProvider } from 'next-intl'
import { type ReactNode } from 'react'

interface I18nProviderProps {
  locale: string
  messages: Record<string, unknown>
  children: ReactNode
}

/**
 * Client-side i18n provider.
 * Layout'ta sarmalayarak tüm client component'lerde useTranslations() kullanımını sağlar.
 */
export default function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
