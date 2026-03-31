'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Loader2, Shield, Briefcase } from 'lucide-react'

const TABS = [
  { id: 'is', label: 'İş Sözleşmesi', tip: 'is_sozlesmesi', icon: Briefcase },
  { id: 'gelisim', label: 'Gelişim Bedeli', tip: 'gelisim_bedeli', icon: FileText },
  { id: 'guvenlik', label: 'Sistem Güvenliği', tip: 'sistem_guvenligi', icon: Shield },
]

const IS_MADDELER = [
  'Çalışma koşulları taraflarca belirlenir.',
  'Ücret ve ödemeler aylık olarak yapılır.',
  'Yıllık izin hakları yasal düzenlemelere uygundur.',
  'Fesih durumunda bildirim süreleri uygulanır.',
  'Gizlilik yükümlülüğü sözleşme sonrası da devam eder.',
]

const GELISIM_MADDELER = [
  '0-2 yıl: %100 geri ödeme',
  '2-3 yıl: %75 geri ödeme',
  '3-4 yıl: %50 geri ödeme',
  '4-5 yıl: %25 geri ödeme',
  '5+ yıl: %0 geri ödeme',
  'Bu tutarlar maaş değildir, kazanılmış ücret sayılmaz.',
]

const GUVENLIK_MADDELER = [
  'Sistem şifrelerini başkalarıyla paylaşmayacağım.',
  'İş verilerini sızdırmayacağım.',
  'Cihaz güvenliğine dikkat edeceğim.',
]

export default function SozlesmePersonelPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('is')
  const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  const handleOnayla = async (tip: string) => {
    if (!checkboxes[tip]) return
    setLoading(true)
    try {
      const res = await fetch('/api/sozlesme/onay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sozlesme_tipi: tip }),
      })
      const j = await res.json()
      if (res.ok && j.ok) {
        setCheckboxes((c) => ({ ...c, [tip]: false }))
        const idx = TABS.findIndex((t) => t.tip === tip)
        if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id)
        else router.replace('/panel')
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
          <h1 className="text-2xl font-bold mb-2">Personel Sözleşmeleri</h1>
          <p className="text-muted-foreground text-sm mb-6">Aşağıdaki sözleşmeleri sırayla okuyup onaylayın.</p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 bg-muted/30">
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-2">
                  <t.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {TABS.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                <Card className="border-white/10 bg-transparent">
                  <CardHeader>
                    <CardTitle>{tab.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tab.id === 'is' && (
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {IS_MADDELER.map((m, i) => (
                          <li key={i}>• {m}</li>
                        ))}
                      </ul>
                    )}
                    {tab.id === 'gelisim' && (
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {GELISIM_MADDELER.map((m, i) => (
                          <li key={i}>• {m}</li>
                        ))}
                      </ul>
                    )}
                    {tab.id === 'guvenlik' && (
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {GUVENLIK_MADDELER.map((m, i) => (
                          <li key={i}>• {m}</li>
                        ))}
                      </ul>
                    )}

                    <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-muted/30 p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkboxes[tab.tip] ?? false}
                        onChange={(e) => setCheckboxes((c) => ({ ...c, [tab.tip]: e.target.checked }))}
                        className="mt-1 h-4 w-4 rounded border-primary text-primary"
                      />
                      <span className="text-sm">Okudum, kabul ediyorum.</span>
                    </label>

                    <Button
                      onClick={() => handleOnayla(tab.tip)}
                      disabled={!checkboxes[tab.tip] || loading}
                      className="w-full"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Onayla
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
