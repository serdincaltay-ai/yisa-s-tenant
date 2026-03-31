"use client"

import Image from "next/image"
import Link from "next/link"

type YisaLogoVariant = "full" | "compact" | "icon-only"

interface YisaLogoProps {
  variant?: YisaLogoVariant
  className?: string
  href?: string
  showAcronym?: boolean
}

const ACRONYM = "Yönetici İşletmeci Sporcu Antrenör Sistemi"

export function YisaLogo({
  variant = "full",
  className = "",
  href,
  showAcronym = true,
}: YisaLogoProps) {
  const content = (
    <div
      className={`flex flex-col items-center text-center ${className}`}
      role="img"
      aria-label="YİSA-S - Yönetici İşletmeci Sporcu Antrenör Sistemi"
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
        <Image
          src="/logo.png"
          alt="YİSA-S logosu"
          fill
          className="object-contain"
          priority
          sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
        />
      </div>
      {(variant === "full" || variant === "compact") && (
        <div className="mt-2 sm:mt-3">
          <span
            className="block font-bold tracking-tight text-white"
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: variant === "compact" ? "1.25rem" : "1.5rem",
              letterSpacing: "0.02em",
            }}
          >
            YİSA-S
          </span>
          {showAcronym && variant === "full" && (
            <span
              className="block mt-1 text-white/60 text-xs sm:text-sm max-w-[240px] sm:max-w-none leading-snug"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {ACRONYM}
            </span>
          )}
          {showAcronym && variant === "compact" && (
            <span className="block mt-0.5 text-white/50 text-[10px] sm:text-xs leading-tight">
              {ACRONYM}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-lg">
        {content}
      </Link>
    )
  }

  return content
}

/** Sadece metin: navigasyon/header için yatay logo */
export function YisaLogoInline({
  className = "",
  href = "/",
  showTagline = false,
}: {
  className?: string
  href?: string
  showTagline?: boolean
}) {
  const inner = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0">
        <Image
          src="/logo.png"
          alt=""
          fill
          className="object-contain"
          sizes="36px"
        />
      </div>
      <span className="text-xl font-bold tracking-tight text-white">
        YİSA-S
      </span>
      {showTagline && (
        <span className="hidden sm:inline text-sm text-white/50 ml-1">
          Yönetici İşletmeci Sporcu Antrenör Sistemi
        </span>
      )}
    </div>
  )

  return href ? (
    <Link href={href} className="inline-flex hover:opacity-90 transition-opacity">
      {inner}
    </Link>
  ) : (
    inner
  )
}
