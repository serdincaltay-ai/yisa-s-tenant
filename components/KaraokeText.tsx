'use client'

import { useMemo } from 'react'

/* ================================================================
   Karaoke Tarzi Metin Vurgulama
   Ses oynatilirken kelimeleri vurgular
   ================================================================ */

interface KaraokeTextProps {
  text: string
  highlightIndex: number // karakter indeksi — -1 = vurgulama yok
  isActive: boolean
}

export default function KaraokeText({ text, highlightIndex, isActive }: KaraokeTextProps) {
  const segments = useMemo(() => {
    if (!isActive || highlightIndex < 0) {
      return [{ text, highlighted: false }]
    }

    // Mevcut kelimenin sınırlarını bul
    let wordStart = highlightIndex
    let wordEnd = highlightIndex

    while (wordStart > 0 && text[wordStart - 1] !== ' ') wordStart--
    while (wordEnd < text.length && text[wordEnd] !== ' ') wordEnd++

    const before = text.slice(0, wordStart)
    const word = text.slice(wordStart, wordEnd)
    const after = text.slice(wordEnd)

    const result: { text: string; highlighted: boolean }[] = []
    if (before) result.push({ text: before, highlighted: false })
    if (word) result.push({ text: word, highlighted: true })
    if (after) result.push({ text: after, highlighted: false })
    return result
  }, [text, highlightIndex, isActive])

  return (
    <span>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <span
            key={i}
            className="bg-cyan-500/30 text-white rounded px-0.5 transition-colors duration-150"
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  )
}
