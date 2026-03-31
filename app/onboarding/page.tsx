'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  Upload,
  Palette,
  Layout,
  CheckCircle2,
  Bot,
  Send,
  Sparkles,
  Building2,
  Tag,
  Image as ImageIcon,
  Eye,
  ChevronRight,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type TemplateType = 'standard' | 'medium' | 'premium'

interface RenkPaleti {
  primary: string
  secondary: string
  accent: string
  bg: string
}

interface OnboardingData {
  tesis_adi?: string
  branslar?: string[]
  logo_url?: string
  logo_style?: string
  renk_paleti?: RenkPaleti
  sablon_tipi?: TemplateType
  telefon?: string
  email?: string
  adres?: string
}

interface ChatMessage {
  role: 'robot' | 'user'
  content: string
  timestamp: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BRANS_SECENEKLERI = [
  'Artistik Cimnastik',
  'Ritmik Cimnastik',
  'Yuzme',
  'Basketbol',
  'Voleybol',
  'Futbol',
  'Tenis',
  'Atletizm',
  'Dans',
  'Jimnastik',
  'Boks',
  'Judo',
  'Karate',
  'Taekwondo',
  'Pilates',
  'Yoga',
]

const RENK_PALETLERI: { ad: string; palet: RenkPaleti }[] = [
  {
    ad: 'Okyanus',
    palet: { primary: '#0f3460', secondary: '#16213e', accent: '#0ea5e9', bg: '#0a0a1a' },
  },
  {
    ad: 'Orman',
    palet: { primary: '#065f46', secondary: '#064e3b', accent: '#10b981', bg: '#0a1a0a' },
  },
  {
    ad: 'Gece',
    palet: { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560', bg: '#0f0f23' },
  },
  {
    ad: 'Altin',
    palet: { primary: '#7c2d12', secondary: '#451a03', accent: '#f59e0b', bg: '#1a0f0a' },
  },
]

const LOGO_STILLERI = [
  { value: 'minimalist', label: 'Minimalist', icon: '◯', desc: 'Sade ve modern' },
  { value: 'colorful', label: 'Cok Renkli', icon: '🎨', desc: 'Canli ve enerjik' },
  { value: 'text-based', label: 'Metin Tabanli', icon: 'Aa', desc: 'Tipografi odakli' },
]

const SABLON_TIPLERI: { value: TemplateType; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'standard', label: 'Basit', desc: 'Temiz, hizli, minimal tasarim', icon: <Layout className="h-5 w-5" /> },
  { value: 'medium', label: 'Orta', desc: 'Gradientler, istatistikler, SSS', icon: <Sparkles className="h-5 w-5" /> },
  { value: 'premium', label: 'Luks', desc: 'Animasyonlar, tam sayfa, premium', icon: <Eye className="h-5 w-5" /> },
]

const TOTAL_STEPS = 7

const ROBOT_MESAJLARI: Record<number, string> = {
  1: 'Hosgeldiniz! Ben YiSA-S kurulum robotuyum. Tesisinizin adini ve temel bilgilerini yazin, hep birlikte harika bir sayfa olusturalim!',
  2: 'Harika! Simdi hangi spor branslarinda hizmet veriyorsunuz? Birden fazla secebilirsiniz.',
  3: 'Logonuz var mi? Kendiniz yukleyebilir veya yapay zeka ile tasarlatabiliriz!',
  4: 'Logonuzun stilini secelim. Nasil bir logo istersiniz?',
  5: 'Guzel! Simdi tesisinizin renk paletini secelim. Bu renkler sitenizin tum gorunumunu belirleyecek.',
  6: 'Son adim olarak, sayfa sablonunuzu secin. Her sablon farkli bir gorsel deneyim sunar.',
  7: 'Mukemmel! Iste tesisinizin on izlemesi. Begendiyseniz "Onayla" butonuna basin!',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)

  const [data, setData] = useState<OnboardingData>({
    branslar: [],
    renk_paleti: RENK_PALETLERI[0].palet,
    sablon_tipi: 'standard',
  })

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoGenerating, setLogoGenerating] = useState(false)
  const [logoChoice, setLogoChoice] = useState<'upload' | 'generate' | null>(null)

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Add robot message when step changes
  useEffect(() => {
    const msg = ROBOT_MESAJLARI[step]
    if (msg) {
      setChatMessages((prev) => {
        const lastRobot = [...prev].reverse().find((m) => m.role === 'robot')
        if (lastRobot?.content === msg) return prev
        return [...prev, { role: 'robot', content: msg, timestamp: Date.now() }]
      })
    }
  }, [step])

  // Initialize onboarding session
  const initSession = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/start', { method: 'POST' })
      const result = await res.json()
      if (res.status === 401) {
        router.push('/auth/login?redirect=/onboarding')
        return
      }
      if (result.ok) {
        setSessionId(result.session_id)
        if (result.resumed && result.data) {
          setData((prev) => ({ ...prev, ...result.data }))
          setStep(result.current_step || 1)
        }
      }
    } catch {
      // Network error
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    initSession()
  }, [initSession])

  // Save step to API
  const saveStep = async (stepNum: number, stepData: Record<string, unknown>) => {
    if (!sessionId) return
    setSaving(true)
    try {
      const res = await fetch('/api/onboarding/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, step: stepNum, data: stepData }),
      })
      const result = await res.json()
      if (result.ok) {
        setData((prev) => ({ ...prev, ...stepData }))
      }
    } catch {
      // Network error
    } finally {
      setSaving(false)
    }
  }

  // Complete onboarding
  const handleComplete = async () => {
    if (!sessionId) return
    setCompleting(true)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      const result = await res.json()
      if (result.ok) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'robot',
            content: `Tebrikler! "${result.slug}" basariyla olusturuldu! ${result.subdomain_url ? `Siteniz: ${result.subdomain_url}` : ''} Simdi yonetim panelinize yonlendiriliyorsunuz...`,
            timestamp: Date.now(),
          },
        ])
        setTimeout(() => {
          router.push('/franchise')
        }, 3000)
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'robot', content: `Bir hata olustu: ${result.error}. Lutfen tekrar deneyin.`, timestamp: Date.now() },
        ])
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'robot', content: 'Baglanti hatasi. Lutfen tekrar deneyin.', timestamp: Date.now() },
      ])
    } finally {
      setCompleting(false)
    }
  }

  // Step 1: Tesis bilgileri
  const handleStep1Submit = async () => {
    const tesisAdi = inputValue.trim()
    if (!tesisAdi) return
    setChatMessages((prev) => [...prev, { role: 'user', content: tesisAdi, timestamp: Date.now() }])
    setInputValue('')
    await saveStep(1, { tesis_adi: tesisAdi })
    setStep(2)
  }

  // Step 2: Brans secimi
  const handleBransToggle = (brans: string) => {
    setData((prev) => {
      const current = prev.branslar || []
      const updated = current.includes(brans) ? current.filter((b) => b !== brans) : [...current, brans]
      return { ...prev, branslar: updated }
    })
  }

  const handleStep2Submit = async () => {
    const branslar = data.branslar || []
    if (branslar.length === 0) return
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', content: `Secilen branslar: ${branslar.join(', ')}`, timestamp: Date.now() },
    ])
    await saveStep(2, { branslar })
    setStep(3)
  }

  // Step 3: Logo secimi
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/onboarding/logo-upload', { method: 'POST', body: formData })
      const result = await res.json()
      if (result.ok && result.logo_url) {
        setData((prev) => ({ ...prev, logo_url: result.logo_url }))
        setChatMessages((prev) => [
          ...prev,
          { role: 'user', content: 'Logomu yukledim!', timestamp: Date.now() },
          { role: 'robot', content: 'Logo basariyla yuklendi! Bir sonraki adima gecelim.', timestamp: Date.now() },
        ])
        await saveStep(4, { logo_url: result.logo_url })
        setStep(5) // Logo yuklendiyse stil adimini atla
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'robot', content: `Logo yuklenemedi: ${result.error ?? 'Bilinmeyen hata'}`, timestamp: Date.now() },
        ])
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'robot', content: 'Logo yuklenirken baglanti hatasi olustu.', timestamp: Date.now() },
      ])
    } finally {
      setLogoUploading(false)
    }
  }

  // Step 4: Logo tasarim stili
  const handleLogoGenerate = async (style: string) => {
    setLogoGenerating(true)
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', content: `Logo stili: ${style}`, timestamp: Date.now() },
      { role: 'robot', content: 'Logo tasarlaniyor, lutfen bekleyin...', timestamp: Date.now() },
    ])
    try {
      const res = await fetch('/api/onboarding/logo-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tesis_adi: data.tesis_adi, style }),
      })
      const result = await res.json()
      if (result.ok && result.logo_url) {
        setData((prev) => ({ ...prev, logo_url: result.logo_url, logo_style: style }))
        setChatMessages((prev) => [
          ...prev,
          { role: 'robot', content: 'Logo hazir! Begendiniz mi? Devam edelim.', timestamp: Date.now() },
        ])
        await saveStep(4, { logo_url: result.logo_url, logo_style: style })
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'robot',
            content: result.placeholder
              ? 'Logo uretimi su an icin kulanilamiyor. Daha sonra yukleyebilirsiniz. Devam edelim!'
              : `Logo uretilemedi: ${result.error}`,
            timestamp: Date.now(),
          },
        ])
        await saveStep(4, { logo_style: style })
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'robot', content: 'Logo uretilirken hata olustu. Devam edebilirsiniz.', timestamp: Date.now() },
      ])
    } finally {
      setLogoGenerating(false)
      setStep(5)
    }
  }

  // Step 5: Renk paleti
  const handlePaletSelect = async (palet: RenkPaleti) => {
    setData((prev) => ({ ...prev, renk_paleti: palet }))
    const paletAdi = RENK_PALETLERI.find((p) => p.palet.primary === palet.primary)?.ad ?? 'Ozel'
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', content: `Renk paleti: ${paletAdi}`, timestamp: Date.now() },
    ])
    await saveStep(5, { renk_paleti: palet })
    setStep(6)
  }

  // Step 6: Sablon secimi
  const handleSablonSelect = async (sablon: TemplateType) => {
    const label = SABLON_TIPLERI.find((s) => s.value === sablon)?.label ?? sablon
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', content: `Sablon: ${label}`, timestamp: Date.now() },
    ])
    setData((prev) => ({ ...prev, sablon_tipi: sablon }))
    await saveStep(6, { sablon_tipi: sablon })
    setStep(7)
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-100">YiSA-S Kurulum Robotu</h1>
                <p className="text-xs text-zinc-500">Tesisinizi adim adim kuralim</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Adim {step} / {TOTAL_STEPS}</p>
            </div>
          </div>
          <Progress value={progress} className="mt-2 h-1.5" />
        </div>
      </div>

      {/* Main Content — Split View */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col lg:max-w-xl lg:border-r lg:border-zinc-800">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'robot' && (
                  <div className="flex-shrink-0 mr-2 mt-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
                      <Bot className="h-4 w-4 text-cyan-400" />
                    </div>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-600/20 border border-cyan-500/20 text-cyan-100'
                      : 'bg-zinc-800/80 border border-zinc-700/50 text-zinc-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Step-specific interactive UI */}
            {step === 1 && <Step1Input value={inputValue} onChange={setInputValue} onSubmit={handleStep1Submit} saving={saving} />}
            {step === 2 && (
              <Step2Branslar
                selected={data.branslar || []}
                onToggle={handleBransToggle}
                onSubmit={handleStep2Submit}
                saving={saving}
              />
            )}
            {step === 3 && (
              <Step3Logo
                logoChoice={logoChoice}
                setLogoChoice={setLogoChoice}
                onUploadClick={() => fileInputRef.current?.click()}
                logoUploading={logoUploading}
                onSkipToGenerate={() => setStep(4)}
              />
            )}
            {step === 4 && (
              <Step4LogoStyle onSelect={handleLogoGenerate} generating={logoGenerating} />
            )}
            {step === 5 && <Step5Palet onSelect={handlePaletSelect} selected={data.renk_paleti} />}
            {step === 6 && <Step6Sablon onSelect={handleSablonSelect} />}
            {step === 7 && (
              <Step7Onizleme
                data={data}
                onConfirm={handleComplete}
                completing={completing}
                onBack={() => setStep(1)}
              />
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>

        {/* Right: Live Preview */}
        <div className="hidden lg:flex flex-1 flex-col bg-zinc-900/50 overflow-y-auto">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Canli Onizleme
            </h2>
          </div>
          <div className="flex-1 p-6">
            <LivePreview data={data} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step Components ─────────────────────────────────────────────────────────

function Step1Input({
  value,
  onChange,
  onSubmit,
  saving,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tesisinizin adi (ornek: BJK Tuzla Cimnastik)"
          className="border-zinc-700 bg-zinc-800/80 text-zinc-100 placeholder:text-zinc-500 flex-1"
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        />
        <Button
          onClick={onSubmit}
          disabled={!value.trim() || saving}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Building2 className="h-3.5 w-3.5" />
        Tesis adini yazin ve gonderin
      </div>
    </div>
  )
}

function Step2Branslar({
  selected,
  onToggle,
  onSubmit,
  saving,
}: {
  selected: string[]
  onToggle: (b: string) => void
  onSubmit: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <Tag className="h-3.5 w-3.5" />
        Birden fazla brans secebilirsiniz
      </div>
      <div className="flex flex-wrap gap-2">
        {BRANS_SECENEKLERI.map((brans) => (
          <button
            key={brans}
            onClick={() => onToggle(brans)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selected.includes(brans)
                ? 'bg-cyan-600/30 border border-cyan-500/50 text-cyan-300'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            {brans}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <Button
          onClick={onSubmit}
          disabled={saving}
          className="bg-cyan-600 hover:bg-cyan-700 text-white w-full"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
          {selected.length} brans secildi — Devam
        </Button>
      )}
    </div>
  )
}

function Step3Logo({
  logoChoice,
  setLogoChoice,
  onUploadClick,
  logoUploading,
  onSkipToGenerate,
}: {
  logoChoice: 'upload' | 'generate' | null
  setLogoChoice: (v: 'upload' | 'generate' | null) => void
  onUploadClick: () => void
  logoUploading: boolean
  onSkipToGenerate: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            setLogoChoice('upload')
            onUploadClick()
          }}
          disabled={logoUploading}
          className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
            logoChoice === 'upload'
              ? 'border-cyan-500/50 bg-cyan-600/10'
              : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
          }`}
        >
          {logoUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          ) : (
            <Upload className="h-6 w-6 text-zinc-400" />
          )}
          <span className="text-xs text-zinc-300">Logo Yukle</span>
        </button>
        <button
          onClick={() => {
            setLogoChoice('generate')
            onSkipToGenerate()
          }}
          className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
            logoChoice === 'generate'
              ? 'border-cyan-500/50 bg-cyan-600/10'
              : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
          }`}
        >
          <Sparkles className="h-6 w-6 text-zinc-400" />
          <span className="text-xs text-zinc-300">AI ile Tasarla</span>
        </button>
      </div>
    </div>
  )
}

function Step4LogoStyle({
  onSelect,
  generating,
}: {
  onSelect: (style: string) => void
  generating: boolean
}) {
  return (
    <div className="space-y-3">
      {generating ? (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-zinc-700 bg-zinc-800/50">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          <span className="text-sm text-zinc-300">Logo tasarlaniyor...</span>
        </div>
      ) : (
        <div className="grid gap-2">
          {LOGO_STILLERI.map((stil) => (
            <button
              key={stil.value}
              onClick={() => onSelect(stil.value)}
              className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 p-3 hover:border-cyan-500/30 hover:bg-cyan-600/5 transition-all text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-700/50 text-lg">
                {stil.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{stil.label}</p>
                <p className="text-xs text-zinc-500">{stil.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Step5Palet({
  onSelect,
  selected,
}: {
  onSelect: (p: RenkPaleti) => void
  selected?: RenkPaleti
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
        <Palette className="h-3.5 w-3.5" />
        Bir renk paleti secin
      </div>
      <div className="grid grid-cols-2 gap-3">
        {RENK_PALETLERI.map((item) => (
          <button
            key={item.ad}
            onClick={() => onSelect(item.palet)}
            className={`rounded-xl border p-3 transition-all ${
              selected?.primary === item.palet.primary
                ? 'border-cyan-500/50 bg-cyan-600/10 ring-1 ring-cyan-500/30'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
            }`}
          >
            <div className="flex gap-1.5 mb-2">
              {Object.values(item.palet).map((color, i) => (
                <div
                  key={i}
                  className="h-6 w-6 rounded-md border border-white/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-zinc-300">{item.ad}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function Step6Sablon({ onSelect }: { onSelect: (s: TemplateType) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
        <Layout className="h-3.5 w-3.5" />
        Sayfa sablonunuzu secin
      </div>
      <div className="grid gap-2">
        {SABLON_TIPLERI.map((sablon) => (
          <button
            key={sablon.value}
            onClick={() => onSelect(sablon.value)}
            className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 hover:border-cyan-500/30 hover:bg-cyan-600/5 transition-all text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-700/50 text-cyan-400">
              {sablon.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-200">{sablon.label}</p>
              <p className="text-xs text-zinc-500">{sablon.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </button>
        ))}
      </div>
    </div>
  )
}

function Step7Onizleme({
  data,
  onConfirm,
  completing,
  onBack,
}: {
  data: OnboardingData
  onConfirm: () => void
  completing: boolean
  onBack: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Mobile preview (hidden on lg) */}
      <div className="lg:hidden">
        <LivePreview data={data} />
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={completing}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex-1"
        >
          Bastan Baslat
        </Button>
        <Button
          onClick={onConfirm}
          disabled={completing}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white flex-1"
        >
          {completing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Onayla ve Olustur
        </Button>
      </div>
    </div>
  )
}

// ─── Live Preview ────────────────────────────────────────────────────────────

function LivePreview({ data }: { data: OnboardingData }) {
  const tesisAdi = data.tesis_adi || 'Tesis Adiniz'
  const branslar = data.branslar || []
  const palet = data.renk_paleti || RENK_PALETLERI[0].palet
  const sablonLabel = SABLON_TIPLERI.find((s) => s.value === data.sablon_tipi)?.label ?? 'Basit'

  return (
    <div
      className="rounded-2xl border border-zinc-700/50 overflow-hidden shadow-2xl"
      style={{ backgroundColor: palet.bg }}
    >
      {/* Mini Navbar Preview */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: palet.primary, borderColor: palet.secondary }}
      >
        <div className="flex items-center gap-2">
          {data.logo_url ? (
            <img src={data.logo_url} alt="Logo" className="h-8 w-8 rounded-lg object-contain bg-white/10 p-0.5" />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white/80"
              style={{ backgroundColor: palet.accent + '33' }}
            >
              {tesisAdi.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold text-white/90">{tesisAdi}</span>
        </div>
        <div className="flex gap-2">
          {['Hakkimizda', 'Paketler', 'Iletisim'].map((nav) => (
            <span key={nav} className="text-[10px] text-white/50 hidden sm:inline">{nav}</span>
          ))}
        </div>
      </div>

      {/* Hero Preview */}
      <div className="px-6 py-10 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${palet.accent}, transparent 70%)`,
          }}
        />
        <div className="relative">
          <h2 className="text-xl font-bold text-white/90 mb-2">{tesisAdi}</h2>
          <p className="text-xs text-white/50 mb-4">
            {branslar.length > 0 ? branslar.join(' · ') : 'Spor branslariniz burada gorunecek'}
          </p>
          <div
            className="inline-block rounded-full px-4 py-1.5 text-xs font-medium text-white/90"
            style={{ backgroundColor: palet.accent + '44' }}
          >
            Ucretsiz Deneme Dersi
          </div>
        </div>
      </div>

      {/* Template badge */}
      <div className="px-4 py-3 border-t" style={{ borderColor: palet.secondary }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/30">Sablon: {sablonLabel}</span>
          <div className="flex gap-1">
            {Object.values(palet).map((color, i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-sm border border-white/10"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="px-4 py-4 grid grid-cols-3 gap-2" style={{ borderTop: `1px solid ${palet.secondary}` }}>
        {[
          { icon: <ImageIcon className="h-3.5 w-3.5" />, label: 'Logo' },
          { icon: <Palette className="h-3.5 w-3.5" />, label: 'Renkler' },
          { icon: <Layout className="h-3.5 w-3.5" />, label: 'Sablon' },
        ].map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1 rounded-lg p-2"
            style={{ backgroundColor: palet.primary + '44' }}
          >
            <span style={{ color: palet.accent }}>{item.icon}</span>
            <span className="text-[10px] text-white/50">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Footer Preview */}
      <div className="px-4 py-2 text-center border-t" style={{ borderColor: palet.secondary }}>
        <p className="text-[9px] text-white/20">Powered by YiSA-S Spor Teknolojileri</p>
      </div>
    </div>
  )
}
