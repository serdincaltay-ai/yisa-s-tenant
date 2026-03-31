'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  CalendarDays,
} from 'lucide-react'

/* ─── Tipler ─── */
interface AvailableSlot {
  date: string
  time: string
  label: string
}

export interface KayitWizardProps {
  tenantId: string
  tenantName: string
  availableSlots?: AvailableSlot[]
  onComplete?: () => void
  onGeri?: () => void
}

/* ─── Robot rehberlik mesajları ─── */
const ROBOT_MESAJLARI = [
  'Hadi başlayalım! Önce çocuğunuzun bilgilerini alalım.',
  'Harika! Şimdi fiziksel bilgileri girelim.',
  'Çok iyi gidiyoruz! Spor geçmişini öğrenelim.',
  'Sizin için uygun saatleri belirleyelim.',
  'Son adım! Ölçüm randevusu seçin.',
]

const BRANSLAR = [
  'Artistik Cimnastik',
  'Ritmik Cimnastik',
  'Trampolin',
  'Genel Jimnastik',
  'Temel Hareket Eğitimi',
  'Diğer',
]

/* ─── Mini robot bileşeni ─── */
function MiniRobot({ mesaj }: { mesaj: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-cyan-500/50 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
        </div>
      </div>
      <div className="bg-zinc-800/80 border border-cyan-500/20 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-zinc-200 leading-relaxed">
        {mesaj}
      </div>
    </div>
  )
}

/* ─── Form durumu ─── */
interface FormState {
  ad: string
  yas: string
  cinsiyet: '' | 'E' | 'K'
  boy: string
  kilo: string
  saglik_sorunu: string
  onceki_spor: boolean | null
  onceki_brans: string
  uygun_gunler: string[]
  randevu_slot: string
  veli_ad: string
  veli_telefon: string
}

const initialForm: FormState = {
  ad: '',
  yas: '',
  cinsiyet: '',
  boy: '',
  kilo: '',
  saglik_sorunu: '',
  onceki_spor: null,
  onceki_brans: '',
  uygun_gunler: [],
  randevu_slot: '',
  veli_ad: '',
  veli_telefon: '',
}

const GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

/**
 * KayitWizard — 5 adımlı sporcu kayıt sihirbazı.
 * Her adımda mini robot rehberlik eder.
 */
export default function KayitWizard({
  tenantId,
  tenantName,
  availableSlots = [],
  onComplete,
  onGeri,
}: KayitWizardProps) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialForm)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [createdAthleteId, setCreatedAthleteId] = useState<string | null>(null)

  const totalSteps = 5

  /* ─── Adım validasyonları ─── */
  const canNext = useMemo(() => {
    switch (step) {
      case 0:
        return form.ad.trim().length > 0 && form.yas.trim().length > 0 && form.cinsiyet !== ''
      case 1:
        return form.boy.trim().length > 0 && form.kilo.trim().length > 0
      case 2:
        return form.onceki_spor !== null
      case 3:
        return form.uygun_gunler.length > 0 && form.veli_ad.trim().length > 0 && form.veli_telefon.trim().length > 0
      case 4:
        return form.randevu_slot !== ''
      default:
        return false
    }
  }, [step, form])

  const toggleGun = (gun: string) => {
    setForm((f) => ({
      ...f,
      uygun_gunler: f.uygun_gunler.includes(gun)
        ? f.uygun_gunler.filter((g) => g !== gun)
        : [...f.uygun_gunler, gun],
    }))
  }

  /* ─── Kayıt gönder ─── */
  const handleSubmit = async () => {
    if (sending) return
    setSending(true)
    setError('')
    try {
      // 1) Sporcu kaydı (tekrar denemede atla — zaten oluşturulmuşsa)
      let athleteId = createdAthleteId
      if (!athleteId) {
        const kayitRes = await fetch('/api/tenant-public/kayit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            ad: form.ad.trim(),
            yas: Number(form.yas),
            cinsiyet: form.cinsiyet,
            boy: Number(form.boy),
            kilo: Number(form.kilo),
            saglik_sorunu: form.saglik_sorunu.trim() || undefined,
            onceki_spor: form.onceki_spor,
            onceki_brans: form.onceki_brans || undefined,
            uygun_gunler: form.uygun_gunler,
            veli_ad: form.veli_ad.trim(),
            veli_telefon: form.veli_telefon.trim(),
          }),
        })
        const kayitData = await kayitRes.json()
        if (!kayitRes.ok) {
          setError(kayitData?.error ?? 'Kayıt başarısız')
          return
        }
        athleteId = kayitData.athlete_id ?? null
        if (athleteId) setCreatedAthleteId(athleteId)
      }

      // 2) Randevu oluştur (seçilmişse)
      if (form.randevu_slot) {
        const slot = availableSlots.find(
          (s) => `${s.date}T${s.time}` === form.randevu_slot,
        )
        if (slot) {
          const randevuRes = await fetch('/api/tenant-public/randevu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenant_id: tenantId,
              athlete_id: athleteId,
              scheduled_at: `${slot.date}T${slot.time}:00`,
              parent_name: form.veli_ad.trim(),
              parent_phone: form.veli_telefon.trim(),
            }),
          })
          if (!randevuRes.ok) {
            const randevuData = await randevuRes.json().catch(() => null)
            setError(randevuData?.error ?? 'Randevu oluşturulamadı, lütfen tekrar deneyin.')
            return
          }
        }
      }

      setDone(true)
      onComplete?.()
    } catch {
      setError('Bağlantı hatası, lütfen tekrar deneyin.')
    } finally {
      setSending(false)
    }
  }

  /* ─── Tamamlandı ekranı ─── */
  if (done) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-12 text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center"
        >
          <Check className="w-8 h-8 text-green-400" />
        </motion.div>
        <h2 className="text-xl font-bold text-white">Kayıt Tamamlandı!</h2>
        <p className="text-zinc-400 text-sm">
          Teşekkürler! {tenantName} ekibi sizinle en kısa sürede iletişime geçecektir.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6">
      {/* Üst: geri + progress */}
      <div className="flex items-center gap-3 mb-6">
        {(step > 0 || onGeri) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step > 0 ? setStep(step - 1) : onGeri?.())}
            className="text-zinc-400 hover:text-white -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="flex-1">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-cyan-400' : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Adım {step + 1} / {totalSteps}
          </p>
        </div>
      </div>

      {/* Robot rehber */}
      <MiniRobot mesaj={ROBOT_MESAJLARI[step]} />

      {/* Adımlar */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* ADIM 0: Ad, yaş, cinsiyet */}
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-300">Çocuğun adı *</Label>
                <Input
                  value={form.ad}
                  onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))}
                  placeholder="Ad Soyad"
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Yaşı *</Label>
                  <Input
                    type="number"
                    min={3}
                    max={18}
                    value={form.yas}
                    onChange={(e) => setForm((f) => ({ ...f, yas: e.target.value }))}
                    placeholder="Yaş"
                    className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Cinsiyet *</Label>
                  <div className="flex gap-2 mt-1">
                    {(['E', 'K'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, cinsiyet: c }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                          form.cinsiyet === c
                            ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                            : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        {c === 'E' ? 'Erkek' : 'Kız'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ADIM 1: Boy, kilo, sağlık */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Boy (cm) *</Label>
                  <Input
                    type="number"
                    min={50}
                    max={220}
                    value={form.boy}
                    onChange={(e) => setForm((f) => ({ ...f, boy: e.target.value }))}
                    placeholder="120"
                    className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Kilo (kg) *</Label>
                  <Input
                    type="number"
                    min={10}
                    max={150}
                    value={form.kilo}
                    onChange={(e) => setForm((f) => ({ ...f, kilo: e.target.value }))}
                    placeholder="25"
                    className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Sağlık problemi var mı?</Label>
                <Textarea
                  value={form.saglik_sorunu}
                  onChange={(e) => setForm((f) => ({ ...f, saglik_sorunu: e.target.value }))}
                  placeholder="Varsa yazınız (opsiyonel)"
                  rows={2}
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 resize-none"
                />
              </div>
            </>
          )}

          {/* ADIM 2: Spor geçmişi */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-300">Daha önce spora gitti mi? *</Label>
                <div className="flex gap-3">
                  {([true, false] as const).map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, onceki_spor: val }))}
                      className={`flex-1 py-3 rounded-lg text-sm font-medium border transition ${
                        form.onceki_spor === val
                          ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {val ? 'Evet' : 'Hayır'}
                    </button>
                  ))}
                </div>
              </div>
              {form.onceki_spor && (
                <div className="space-y-2">
                  <Label className="text-zinc-300">Hangi branş?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {BRANSLAR.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, onceki_brans: b }))}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                          form.onceki_brans === b
                            ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                            : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ADIM 3: Uygun saatler + veli bilgi */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-300">Uygun günler *</Label>
                <div className="flex flex-wrap gap-2">
                  {GUNLER.map((gun) => (
                    <button
                      key={gun}
                      type="button"
                      onClick={() => toggleGun(gun)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                        form.uygun_gunler.includes(gun)
                          ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {gun}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Veli adı *</Label>
                <Input
                  value={form.veli_ad}
                  onChange={(e) => setForm((f) => ({ ...f, veli_ad: e.target.value }))}
                  placeholder="Veli ad soyad"
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Telefon *</Label>
                <Input
                  type="tel"
                  value={form.veli_telefon}
                  onChange={(e) => setForm((f) => ({ ...f, veli_telefon: e.target.value }))}
                  placeholder="05XX XXX XX XX"
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>
            </>
          )}

          {/* ADIM 4: Randevu seçimi */}
          {step === 4 && (
            <>
              <div className="space-y-3">
                <Label className="text-zinc-300">Ölçüm randevusu seçin *</Label>
                {availableSlots.length === 0 ? (
                  <p className="text-zinc-500 text-sm">
                    Şu an müsait randevu slotu bulunmuyor. Kayıt sonrası sizinle
                    iletişime geçilecektir.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const key = `${slot.date}T${slot.time}`
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, randevu_slot: key }))}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition ${
                            form.randevu_slot === key
                              ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                          }`}
                        >
                          <CalendarDays className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">{slot.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Hata mesajı */}
      {error && (
        <p className="text-red-400 text-sm mt-3">{error}</p>
      )}

      {/* İleri / Kaydet butonu */}
      <div className="mt-6">
        {step < totalSteps - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-40"
          >
            İleri
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={sending || (!canNext && availableSlots.length > 0)}
            className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Kaydı Tamamla
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
