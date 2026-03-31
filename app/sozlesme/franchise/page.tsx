'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { FileText, Loader2 } from 'lucide-react'

const MADDELER = [
  { id: '1', baslik: 'Taraflar ve Tanımlar', metin: 'Bu sözleşme YİSA-S (Franchise Veren) ile Franchise Alan arasında imzalanmaktadır. Franchise Veren: YİSA-S markası ve sisteminin sahibi. Franchise Alan: Bu sözleşme kapsamında YİSA-S sistemini kullanma hakkı elde eden taraf.' },
  { id: '2', baslik: 'Sözleşme Konusu', metin: 'YİSA-S, Franchise Alan\'a YİSA-S marka, yönetim sistemi ve yazılım platformunu kullanma hakkı tanır. Bu hak belirli bir coğrafi bölge ve sözleşme süresi ile sınırlıdır.' },
  { id: '3', baslik: 'Franchise Bedeli ve Ödeme Koşulları', metin: 'Franchise bedeli, başlangıç ücreti ve aylık/ yıllık katılım paylarından oluşur. Ödeme koşulları ayrı ek sözleşmede belirtilir. Gecikme durumunda yasal faiz uygulanır.' },
  { id: '4', baslik: 'Tarafların Yükümlülükleri', metin: 'Franchise Veren: Eğitim, destek, güncelleme sağlar. Franchise Alan: Marka standartlarına uyum, raporlama, katılım payı ödemesi ile yükümlüdür.' },
  { id: '5', baslik: 'Gizlilik ve Veri Koruma', metin: 'Taraflar, sözleşme süresince ve sonrasında elde ettikleri gizli bilgileri üçüncü taraflarla paylaşmayacaktır. KVKK ve ilgili mevzuata uyum zorunludur.' },
  { id: '6', baslik: 'Fikri Mülkiyet Hakları', metin: 'YİSA-S markası, logosu, yazılımı ve tüm materyaller Franchise Veren\'e aittir. Franchise Alan sadece kullanım hakkına sahiptir, mülkiyet devri söz konusu değildir.' },
  { id: '7', baslik: 'Sözleşme Süresi ve Fesih', metin: 'Sözleşme belirlenen süre ile geçerlidir. Taraflar karşılıklı anlaşma veya ciddi ihlal durumunda fesih hakkına sahiptir. Fesih sonrası yükümlülükler devam eder.' },
  { id: '8', baslik: 'Uyuşmazlık Çözümü', metin: 'Uyuşmazlıklar öncelikle dostane yollarla çözümlenir. Çözülemezse İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.' },
]

export default function SozlesmeFranchisePage() {
  const router = useRouter()
  const [kabul, setKabul] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleOnayla = async () => {
    if (!kabul) return
    setLoading(true)
    try {
      const res = await fetch('/api/sozlesme/onay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sozlesme_tipi: 'franchise_sozlesme' }),
      })
      const j = await res.json()
      if (res.ok && j.ok) {
        router.replace('/franchise')
      } else {
        alert(j.error ?? 'Onay kaydedilemedi')
      }
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
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">YİSA-S Franchise Sözleşmesi</h1>
              <p className="text-sm text-muted-foreground">Lütfen sözleşmeyi okuyun ve onaylayın</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full mb-6">
            {MADDELER.map((m) => (
              <AccordionItem key={m.id} value={m.id} className="border-white/10">
                <AccordionTrigger className="text-left hover:no-underline hover:text-primary">
                  {m.id}. {m.baslik}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {m.metin}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors mb-6">
            <input
              type="checkbox"
              checked={kabul}
              onChange={(e) => setKabul(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-primary text-primary"
            />
            <span className="text-sm">Okudum, anladım, kabul ediyorum.</span>
          </label>

          <Button
            onClick={handleOnayla}
            disabled={!kabul || loading}
            className="w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Onayla
          </Button>
        </div>
      </div>
    </div>
  )
}
