'use client'

/**
 * YİSA-S Asistan robotu: büyütülebilir, küçültülebilir, sürüklenebilir sohbet penceresi.
 * GÖREV 2 Dashboard tasarımı — iskelet bileşen. Dosya yükleme (ses, video, resim, döküman) placeholder.
 * Deploy yok; Patron seçimine göre entegre edilir.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { MessageCircle, Minimize2, Maximize2, Square, Paperclip } from 'lucide-react'

const SIZES = { small: { w: 320, h: 400 }, medium: { w: 420, h: 520 }, large: { w: 560, h: 640 } } as const
type SizeKey = keyof typeof SIZES

export default function FloatingAssistantChat() {
  const [position, setPosition] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 360 : 400, y: 120 })
  const [sizeKey, setSizeKey] = useState<SizeKey>('medium')
  const [minimized, setMinimized] = useState(false)
  const [files, setFiles] = useState<{ name: string; type: string }[]>([])
  const dragRef = useRef<{ startX: number; startY: number; startPos: { x: number; y: number } } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const size = SIZES[sizeKey]

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPos: { ...position } }
  }, [position])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setPosition({
        x: Math.max(0, dragRef.current.startPos.x + dx),
        y: Math.max(0, dragRef.current.startPos.y + dy),
      })
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files
    if (!chosen?.length) return
    const next = [...files]
    for (let i = 0; i < chosen.length; i++) {
      const f = chosen[i]
      next.push({ name: f.name, type: f.type })
    }
    setFiles(next)
    e.target.value = ''
  }

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white transition-transform hover:scale-105"
        style={{
          left: position.x,
          top: position.y,
          backgroundColor: 'var(--primary, #F59E0B)',
        }}
        aria-label="Asistanı aç"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div
      className="fixed z-50 flex flex-col rounded-2xl border border-slate-600/50 bg-slate-800/95 shadow-xl overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: size.w,
        height: size.h,
      }}
    >
      {/* Başlık — sürükleme alanı */}
      <div
        role="button"
        tabIndex={0}
        onMouseDown={onMouseDown}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLElement).click()}
        className="flex items-center justify-between px-4 py-2 cursor-grab active:cursor-grabbing border-b border-slate-600/50"
        style={{ backgroundColor: 'var(--primary, #F59E0B)', color: '#0F172A' }}
      >
        <span className="font-semibold text-sm">YİSA-S Asistan</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSizeKey(sizeKey === 'small' ? 'medium' : 'small')}
            className="p-1.5 rounded hover:bg-black/10"
            aria-label="Küçült"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setSizeKey(sizeKey === 'large' ? 'medium' : 'large')}
            className="p-1.5 rounded hover:bg-black/10"
            aria-label="Büyüt"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="p-1.5 rounded hover:bg-black/10"
            aria-label="Küçült (simge)"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dosya yükleme alanı */}
      <div className="px-3 py-2 border-b border-slate-600/30 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,video/*,image/*,.pdf,.doc,"
          onChange={onFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm"
        >
          <Paperclip className="w-4 h-4" />
          Dosya ekle (ses, video, resim, döküman)
        </button>
        {files.length > 0 && (
          <span className="text-xs text-slate-400">{files.length} dosya</span>
        )}
      </div>

      {/* Sohbet alanı — placeholder */}
      <div className="flex-1 overflow-auto p-4 text-slate-400 text-sm">
        Sohbet burada. Mevcut flow API’ye bağlanabilir.
        {files.length > 0 && (
          <ul className="mt-2 text-xs">
            {files.map((f, i) => (
              <li key={i}>{f.name} ({f.type})</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
