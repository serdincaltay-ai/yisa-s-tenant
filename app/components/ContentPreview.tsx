'use client'

import ReactMarkdown from 'react-markdown'
import {
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  File,
  Download,
  FileType,
} from 'lucide-react'

const IMG_EXT = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i
const VIDEO_EXT = /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i
const DOC_EXT = /\.(doc|docx|pdf)(\?|$)/i
const DATA_IMG = /^data:image\//i
const DATA_VIDEO = /^data:video\//i
const DATA_AUDIO = /^data:audio\//i

function isMarkdownLike(s: string): boolean {
  const t = s.trim()
  if (t.length < 10) return false
  return (
    /^#+\s/m.test(t) ||
    /^\s*[-*]\s/m.test(t) ||
    /^\d+\.\s/m.test(t) ||
    /\*\*[^*]+\*\*/.test(t) ||
    /\[.+\]\(.+\)/.test(t)
  )
}

function extractMediaItems(icerik: Record<string, unknown>): {
  images: string[]
  videos: string[]
  audios: string[]
  files: { url: string; label?: string }[]
  markdown: string[]
} {
  const images: string[] = []
  const videos: string[] = []
  const audios: string[] = []
  const files: { url: string; label?: string }[] = []
  const markdown: string[] = []

  const imageKeys = ['gorsel', 'gorsel_url', 'image', 'image_url', 'img', 'src', 'url', 'thumbnail', 'poster']
  const videoKeys = ['video', 'video_url', 'video_src', 'video_src_url']
  const audioKeys = ['audio', 'audio_url', 'music', 'muzik', 'ses', 'ses_url']
  const fileKeys = ['file', 'file_url', 'dosya', 'dosya_url', 'attachment', 'doc_url']
  const mdKeys = ['markdown', 'md', 'content', 'metin', 'body', 'aciklama']

  const isUrl = (s: string) => /^https?:\/\//i.test(s) || /^data:/.test(s)

  function visit(obj: unknown, key?: string): void {
    if (obj == null) return
    if (typeof obj === 'string') {
      const s = obj.trim()
      if (!s) return
      if (DATA_IMG.test(s) || IMG_EXT.test(s) || (key && imageKeys.includes(key) && isUrl(s))) {
        if (!images.includes(s)) images.push(s)
        return
      }
      if (DATA_VIDEO.test(s) || VIDEO_EXT.test(s) || (key && videoKeys.includes(key) && isUrl(s))) {
        if (!videos.includes(s)) videos.push(s)
        return
      }
      if (DATA_AUDIO.test(s) || AUDIO_EXT.test(s) || (key && audioKeys.includes(key) && isUrl(s))) {
        if (!audios.includes(s)) audios.push(s)
        return
      }
      if (DOC_EXT.test(s) || (key && fileKeys.includes(key) && isUrl(s))) {
        if (!files.some((f) => f.url === s)) files.push({ url: s, label: key })
        return
      }
      if (isMarkdownLike(s) && (key ? mdKeys.includes(key) : s.length > 50)) {
        if (!markdown.includes(s)) markdown.push(s)
        return
      }
      return
    }
    if (Array.isArray(obj)) {
      obj.forEach((v) => visit(v))
      return
    }
    if (typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        visit(v, k)
      }
    }
  }

  visit(icerik)
  return { images, videos, audios, files, markdown }
}

export function hasMediaContent(icerik: Record<string, unknown>): boolean {
  if (!icerik || typeof icerik !== 'object') return false
  const { images, videos, audios, files, markdown } = extractMediaItems(icerik)
  return images.length > 0 || videos.length > 0 || audios.length > 0 || files.length > 0 || markdown.length > 0
}

type ContentPreviewProps = {
  icerik: Record<string, unknown>
  className?: string
}

export function ContentPreview({ icerik, className = '' }: ContentPreviewProps) {
  if (!icerik || typeof icerik !== 'object') return null

  const { images, videos, audios, files, markdown } = extractMediaItems(icerik)
  const hasMedia = images.length > 0 || videos.length > 0 || audios.length > 0 || files.length > 0 || markdown.length > 0

  if (!hasMedia) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Resimler */}
      {images.length > 0 && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
          <div className="flex items-center gap-2 mb-3 text-cyan-400 text-sm font-medium">
            <ImageIcon size={18} />
            Resim ({images.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((src, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
                <img
                  src={src}
                  alt={`Önizleme ${i + 1}`}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videolar */}
      {videos.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3 text-amber-400 text-sm font-medium">
            <Video size={18} />
            Video ({videos.length})
          </div>
          <div className="space-y-4">
            {videos.map((src, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
                <video
                  src={src}
                  controls
                  className="w-full max-h-64"
                  preload="metadata"
                >
                  Tarayıcınız video oynatmayı desteklemiyor.
                </video>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ses / Müzik */}
      {audios.length > 0 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 mb-3 text-emerald-400 text-sm font-medium">
            <Music size={18} />
            Ses / Müzik ({audios.length})
          </div>
          <div className="space-y-3">
            {audios.map((src, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-900 border border-gray-700">
                <Music size={24} className="text-emerald-400 flex-shrink-0" />
                <audio src={src} controls className="flex-1 max-w-full" preload="metadata" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dosyalar (Word, PDF, genel) */}
      {files.length > 0 && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
          <div className="flex items-center gap-2 mb-3 text-purple-400 text-sm font-medium">
            <FileText size={18} />
            Dosya ({files.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => {
              const name = f.url.split('/').pop() || f.url.split('/').slice(-1)[0] || `Dosya ${i + 1}`
              const isWord = /\.(doc|docx)$/i.test(f.url)
              const isPdf = /\.pdf$/i.test(f.url)
              return (
                <a
                  key={i}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 hover:border-purple-500/50 text-gray-300 hover:text-purple-300 transition-colors"
                >
                  {isWord ? (
                    <span title="Word belgesi"><FileType size={18} className="text-blue-400" /></span>
                  ) : isPdf ? (
                    <span title="PDF"><FileText size={18} className="text-red-400" /></span>
                  ) : (
                    <File size={18} className="text-gray-400" />
                  )}
                  <span className="text-sm truncate max-w-[200px]" title={name}>
                    {name}
                  </span>
                  <Download size={14} />
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Markdown */}
      {markdown.length > 0 && (
        <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-4">
          <div className="flex items-center gap-2 mb-3 text-pink-400 text-sm font-medium">
            <FileText size={18} />
            Markdown / Metin ({markdown.length})
          </div>
          <div className="space-y-4">
            {markdown.map((md, i) => (
              <div
                key={i}
                className="prose prose-invert prose-sm max-w-none rounded-lg bg-gray-900 border border-gray-700 p-4 text-gray-300"
              >
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {md}
                </ReactMarkdown>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
