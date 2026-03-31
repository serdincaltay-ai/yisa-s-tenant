'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, Image, Video } from 'lucide-react'

const KVKK_METIN = `
6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verileriniz;
- Hizmet sunumu, iletişim, bilgilendirme amacıyla işlenecektir.
- Verileriniz yalnızca yasal zorunluluk veya hizmet gerekliliği durumunda üçüncü taraflarla paylaşılabilir.
- Verileriniz güvenli şekilde saklanacak, talep halinde erişim, düzeltme, silme haklarınız kullanılabilecektir.
`

export default function SozlesmeVeliPage() {
  const router = useRouter()
  const [kvkkKabul, setKvkkKabul] = useState(false)
  const [fotografIzni, setFotografIzni] = useState<'evet' | 'hayir' | null>(null)
  const [videoIzni, setVideoIzni] = useState<'evet' | 'hayir' | null>(null)
  const [loading, setLoading] = useState(false)

  const handleOnayla = async () => {
    if (!kvkkKabul) {
      alert('KVKK aydınlatma metnini onaylamanız zorunludur.')
      return
    }
    setLoading(true)
    try {
      const tips: { sozlesme_tipi: string; deger?: boolean }[] = [
        { sozlesme_tipi: 'kvkk' },
      ]
      if (fotografIzni !== null) tips.push({ sozlesme_tipi: 'fotograf_izni', deger: fotografIzni === 'evet' })
      if (videoIzni !== null) tips.push({ sozlesme_tipi: 'video_izni', deger: videoIzni === 'evet' })

      for (const t of tips) {
        const res = await fetch('/api/sozlesme/onay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(t),
        })
        const j = await res.json()
        if (!res.ok || !j.ok) {
          alert(j.error ?? 'Onay kaydedilemedi')
          return
        }
      }
      router.replace('/veli/dashboard')
    } catch {
      alert('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-xl p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-2">KVKK ve İzinler</h1>
          <p className="text-muted-foreground text-sm mb-6">Lütfen aşağıdaki metinleri okuyup onaylayın.</p>

          <div className="space-y-6">
            <Card className="border-white/10 bg-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  KVKK Aydınlatma Metni
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">{KVKK_METIN.trim()}</div>
                <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-muted/30 p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kvkkKabul}
                    onChange={(e) => setKvkkKabul(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-primary text-primary"
                  />
                  <span className="text-sm">KVKK aydınlatma metnini okudum, kabul ediyorum. <span className="text-destructive">*</span></span>
                </label>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Fotoğraf İzni
                </CardTitle>
                <p className="text-sm text-muted-foreground">Çocuğumun fotoğraflarının tesis içi ve sosyal medyada kullanılmasına</p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fotograf"
                      checked={fotografIzni === 'evet'}
                      onChange={() => setFotografIzni('evet')}
                      className="border-primary text-primary"
                    />
                    <span>İzin veriyorum</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fotograf"
                      checked={fotografIzni === 'hayir'}
                      onChange={() => setFotografIzni('hayir')}
                      className="border-primary text-primary"
                    />
                    <span>Vermiyorum</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Video İzni
                </CardTitle>
                <p className="text-sm text-muted-foreground">Çocuğumun videolarının tesis içi ve sosyal medyada kullanılmasına</p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="video"
                      checked={videoIzni === 'evet'}
                      onChange={() => setVideoIzni('evet')}
                      className="border-primary text-primary"
                    />
                    <span>İzin veriyorum</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="video"
                      checked={videoIzni === 'hayir'}
                      onChange={() => setVideoIzni('hayir')}
                      className="border-primary text-primary"
                    />
                    <span>Vermiyorum</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleOnayla}
              disabled={!kvkkKabul || loading}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Onayla ve Devam Et
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
