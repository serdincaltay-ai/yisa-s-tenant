'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { locales, localeNames, type Locale } from '@/i18n/config'

/**
 * Dil değiştirici bileşeni.
 * Cookie tabanlı locale değişimi yapar (next-intl cookie convention).
 */
export default function LanguageSwitcher() {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  function handleChange(newLocale: Locale) {
    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
      window.location.reload()
    })
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleChange(loc)}
          disabled={isPending || loc === locale}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            loc === locale
              ? 'bg-white/20 text-white font-semibold'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          } ${isPending ? 'opacity-50' : ''}`}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  )
}
