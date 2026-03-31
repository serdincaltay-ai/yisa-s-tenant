'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, FileText, Upload, AlertTriangle, Loader2, Plus, Bell, ShieldAlert, Clock } from 'lucide-react'

type HealthRecord = {
  id: string
  athlete_id: string
  athlete_name: string
  record_type: string
  notes: string | null
  recorded_at: string
  created_at: string
  saglik_raporu_gecerlilik?: string | null
}
type Warning = { athlete_id: string; athlete_name: string; recorded_at: string | null; message: string }
type Athlete = { id: string; name: string; surname?: string | null }
type BelgeKontrol = {
  id: string
  athlete_id: string
  athlete_name: string
  record_type: string
  saglik_raporu_gecerlilik: string | null
  durum: 'gecmis' | 'yaklasan' | 'gecerli' | 'belirsiz'
  kalan_gun: number | null
}

function gecerlilikDurumBadge(durum: BelgeKontrol['durum'], kalanGun: number | null) {
  switch (durum) {
    case 'gecmis':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <ShieldAlert className="h-3 w-3" />
          Süresi dolmuş {kalanGun !== null ? `(${Math.abs(kalanGun)} gün)` : ''}
        </span>
      )
    case 'yaklasan':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock className="h-3 w-3" />
          {kalanGun} gün kaldı
        </span>
      )
    case 'belirsiz':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800/30 dark:text-gray-400">
          Geçerlilik bilinmiyor
        </span>
      )
    default:
      return null
  }
}

export default function FranchiseBelgelerPage() {
  const [items, setItems] = useState<HealthRecord[]>([])
  const [warnings, setWarnings] = useState<Warning[]>([])
  const [belgeKontrol, setBelgeKontrol] = useState<BelgeKontrol[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendingNotif, setSendingNotif] = useState<string | null>(null)
  const [form, setForm] = useState({ athlete_id: '', record_type: 'genel', notes: '', saglik_raporu_gecerlilik: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [recRes, athRes, kontrolRes] = await Promise.all([
        fetch('/api/franchise/health-records'),
        fetch('/api/franchise/athletes'),
        fetch('/api/franchise/belgeler/kontrol'),
      ])
      const recData = await recRes.json()
      const athData = await athRes.json()
      const kontrolData = await kontrolRes.json()
      setItems(Array.isArray(recData?.items) ? recData.items : [])
      setWarnings(Array.isArray(recData?.warnings) ? recData.warnings : [])
      setAthletes(Array.isArray(athData?.items) ? athData.items : [])
      setBelgeKontrol(Array.isArray(kontrolData?.items) ? kontrolData.items : [])
    } catch {
      setItems([])
      setWarnings([])
      setAthletes([])
      setBelgeKontrol([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.athlete_id || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/franchise/health-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: form.athlete_id,
          record_type: form.record_type,
          notes: form.notes || undefined,
          saglik_raporu_gecerlilik: form.saglik_raporu_gecerlilik || undefined,
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        setForm({ athlete_id: '', record_type: 'genel', notes: '', saglik_raporu_gecerlilik: '' })
        setShowUpload(false)
        fetchData()
      } else {
        alert(data?.error ?? 'Kayıt başarısız')
      }
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const handleSendWarning = async (athleteId: string, athleteName: string) => {
    if (sendingNotif) return
    setSendingNotif(athleteId)
    try {
      const res = await fetch('/api/franchise/belgeler/uyari-gonder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athlete_id: athleteId }),
      })
      const data = await res.json()
      if (data?.ok) {
        alert(`${athleteName} velisine belge uyarısı gönderildi.`)
      } else {
        alert(data?.error ?? 'Bildirim gönderilemedi')
      }
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSendingNotif(null)
    }
  }

  // Geçerlilik verisini kayıtlarla eşle
  const gecerlilikMap = new Map<string, BelgeKontrol>()
  for (const bk of belgeKontrol) {
    gecerlilikMap.set(bk.id, bk)
  }

  // Gecmis ve yaklasan uyarıları ayır
  const gecmisUyarilar = belgeKontrol.filter((b) => b.durum === 'gecmis')
  const yaklasanUyarilar = belgeKontrol.filter((b) => b.durum === 'yaklasan')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/franchise">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tesis paneline dön
          </Link>
        </Button>
      </div>

      <header>
        <h1 className="text-2xl font-bold text-foreground">Belge Yönetimi</h1>
        <p className="text-muted-foreground">Sağlık raporu, geçerlilik uyarıları, veli/eğitmen yükleme</p>
      </header>

      {gecmisUyarilar.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
              Süresi dolmuş belgeler ({gecmisUyarilar.length})
            </CardTitle>
            <CardDescription>Bu belgelerin geçerlilik süresi dolmuştur — acil yenileme gerekli</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {gecmisUyarilar.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{b.athlete_name}</span>
                    <span className="text-muted-foreground"> — {b.record_type}</span>
                    {b.saglik_raporu_gecerlilik && (
                      <span className="text-red-600 dark:text-red-400 ml-2">
                        (Son geçerlilik: {new Date(b.saglik_raporu_gecerlilik).toLocaleDateString('tr-TR')})
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="ml-2 shrink-0"
                    disabled={sendingNotif === b.athlete_id}
                    onClick={() => handleSendWarning(b.athlete_id, b.athlete_name)}
                  >
                    {sendingNotif === b.athlete_id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Bell className="h-3 w-3 mr-1" />
                        Uyarı gönder
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {yaklasanUyarilar.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Süresi yaklaşan belgeler ({yaklasanUyarilar.length})
            </CardTitle>
            <CardDescription>Bu belgelerin geçerlilik süresi 30 gün içinde dolacak</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {yaklasanUyarilar.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{b.athlete_name}</span>
                    <span className="text-muted-foreground"> — {b.record_type}</span>
                    {b.saglik_raporu_gecerlilik && (
                      <span className="text-amber-600 dark:text-amber-400 ml-2">
                        (Son geçerlilik: {new Date(b.saglik_raporu_gecerlilik).toLocaleDateString('tr-TR')}, {b.kalan_gun} gün kaldı)
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 shrink-0 border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                    disabled={sendingNotif === b.athlete_id}
                    onClick={() => handleSendWarning(b.athlete_id, b.athlete_name)}
                  >
                    {sendingNotif === b.athlete_id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Bell className="h-3 w-3 mr-1" />
                        Uyarı gönder
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {warnings.length > 0 && gecmisUyarilar.length === 0 && yaklasanUyarilar.length === 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Geçerlilik uyarıları
            </CardTitle>
            <CardDescription>Sağlık kaydı 1 yıldan eski veya kayıt yok — yenileme önerilir</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {warnings.map((w) => (
                <li key={w.athlete_id} className="text-sm">
                  <span className="font-medium">{w.athlete_name}</span>
                  <span className="text-muted-foreground"> — {w.message}</span>
                  {w.recorded_at && <span className="text-muted-foreground"> (Son: {new Date(w.recorded_at).toLocaleDateString('tr-TR')})</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sağlık raporu / kayıtlar
            </CardTitle>
            <CardDescription>Öğrenci sağlık kayıtları, geçerlilik takibi</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Plus className="h-4 w-4 mr-1" />
            Kayıt ekle
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showUpload && (
            <form onSubmit={handleUpload} className="rounded-lg border p-4 space-y-3">
              <div>
                <Label>Öğrenci</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" value={form.athlete_id} onChange={(e) => setForm((f) => ({ ...f, athlete_id: e.target.value }))} required>
                  <option value="">Seçin</option>
                  {athletes.map((a) => <option key={a.id} value={a.id}>{a.name} {a.surname ?? ''}</option>)}
                </select>
              </div>
              <div>
                <Label>Kayıt türü</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" value={form.record_type} onChange={(e) => setForm((f) => ({ ...f, record_type: e.target.value }))}>
                  <option value="genel">Genel</option>
                  <option value="saglik_raporu">Sağlık raporu</option>
                  <option value="kontrol">Kontrol</option>
                </select>
              </div>
              <div>
                <Label>Son geçerlilik tarihi</Label>
                <Input
                  type="date"
                  value={form.saglik_raporu_gecerlilik}
                  onChange={(e) => setForm((f) => ({ ...f, saglik_raporu_gecerlilik: e.target.value }))}
                />
              </div>
              <div>
                <Label>Not / açıklama</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="İsteğe bağlı" rows={2} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kaydet'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>İptal</Button>
              </div>
            </form>
          )}
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Henüz sağlık kaydı yok. Kayıt ekleyebilir veya veli/eğitmen yüklemesi için tesis ayarlarını kullanabilirsiniz.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Öğrenci</th>
                    <th className="text-left py-2 font-medium">Tür</th>
                    <th className="text-left py-2 font-medium">Kayıt tarihi</th>
                    <th className="text-left py-2 font-medium">Son geçerlilik</th>
                    <th className="text-left py-2 font-medium">Durum</th>
                    <th className="text-left py-2 font-medium">Not</th>
                    <th className="text-left py-2 font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => {
                    const kontrol = gecerlilikMap.get(r.id)
                    const gecerlilik = r.saglik_raporu_gecerlilik
                    return (
                      <tr key={r.id} className="border-b">
                        <td className="py-2">{r.athlete_name}</td>
                        <td className="py-2">{r.record_type}</td>
                        <td className="py-2">{new Date(r.recorded_at).toLocaleDateString('tr-TR')}</td>
                        <td className="py-2">
                          {gecerlilik
                            ? new Date(gecerlilik).toLocaleDateString('tr-TR')
                            : <span className="text-muted-foreground">—</span>
                          }
                        </td>
                        <td className="py-2">
                          {kontrol
                            ? gecerlilikDurumBadge(kontrol.durum, kontrol.kalan_gun)
                            : gecerlilik
                              ? <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">Geçerli</span>
                              : <span className="text-muted-foreground text-xs">—</span>
                          }
                        </td>
                        <td className="py-2 text-muted-foreground">{r.notes || '—'}</td>
                        <td className="py-2">
                          {kontrol && (kontrol.durum === 'gecmis' || kontrol.durum === 'yaklasan') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              disabled={sendingNotif === r.athlete_id}
                              onClick={() => handleSendWarning(r.athlete_id, r.athlete_name)}
                            >
                              {sendingNotif === r.athlete_id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Bell className="h-3 w-3 mr-1" />
                                  Uyarı
                                </>
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Veli / eğitmen yükleme
          </CardTitle>
          <CardDescription>Belge yükleme (dosya) ileride depolama entegrasyonu ile eklenecek. Şu an sağlık kaydı metin olarak yukarıdan eklenebilir.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
