'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Megaphone, MessageSquare, ClipboardList, Plus, Loader2 } from 'lucide-react'

type Announcement = { id: string; title: string; body: string | null; created_at: string }
type Survey = { id: string; title: string; description: string | null; status: string; created_at: string }

export default function FranchiseIletisimPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loadingAnn, setLoadingAnn] = useState(true)
  const [loadingSur, setLoadingSur] = useState(true)
  const [showDuyuruForm, setShowDuyuruForm] = useState(false)
  const [showAnketForm, setShowAnketForm] = useState(false)
  const [sending, setSending] = useState(false)
  const [duyuruForm, setDuyuruForm] = useState({ title: '', body: '' })
  const [anketForm, setAnketForm] = useState({ title: '', description: '' })

  const fetchAnnouncements = useCallback(async () => {
    setLoadingAnn(true)
    try {
      const res = await fetch('/api/franchise/announcements')
      const data = await res.json()
      setAnnouncements(Array.isArray(data?.items) ? data.items : [])
    } catch {
      setAnnouncements([])
    } finally {
      setLoadingAnn(false)
    }
  }, [])

  const fetchSurveys = useCallback(async () => {
    setLoadingSur(true)
    try {
      const res = await fetch('/api/franchise/surveys')
      const data = await res.json()
      setSurveys(Array.isArray(data?.items) ? data.items : [])
    } catch {
      setSurveys([])
    } finally {
      setLoadingSur(false)
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])
  useEffect(() => {
    fetchSurveys()
  }, [fetchSurveys])

  const handleDuyuruSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!duyuruForm.title.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/franchise/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: duyuruForm.title.trim(), body: duyuruForm.body.trim() || undefined }),
      })
      const data = await res.json()
      if (data?.ok) {
        setDuyuruForm({ title: '', body: '' })
        setShowDuyuruForm(false)
        fetchAnnouncements()
      } else {
        alert(data?.error ?? 'Kayıt başarısız')
      }
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const handleAnketSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!anketForm.title.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/franchise/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: anketForm.title.trim(), description: anketForm.description.trim() || undefined }),
      })
      const data = await res.json()
      if (data?.ok) {
        setAnketForm({ title: '', description: '' })
        setShowAnketForm(false)
        fetchSurveys()
      } else {
        alert(data?.error ?? 'Kayıt başarısız')
      }
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSending(false)
    }
  }

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
        <h1 className="text-2xl font-bold text-foreground">İletişim</h1>
        <p className="text-muted-foreground">Duyurular, anketler, eğitmen–veli mesajlaşma</p>
      </header>

      {/* Duyurular */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Duyurular
            </CardTitle>
            <CardDescription>Toplu duyuru gönderin; veli ve öğrencilere ulaşın</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowDuyuruForm(!showDuyuruForm)}>
            <Plus className="h-4 w-4 mr-1" />
            Yeni duyuru
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDuyuruForm && (
            <form onSubmit={handleDuyuruSubmit} className="rounded-lg border p-4 space-y-3">
              <div>
                <Label>Başlık</Label>
                <Input value={duyuruForm.title} onChange={(e) => setDuyuruForm((f) => ({ ...f, title: e.target.value }))} placeholder="Duyuru başlığı" required />
              </div>
              <div>
                <Label>İçerik (isteğe bağlı)</Label>
                <Textarea value={duyuruForm.body} onChange={(e) => setDuyuruForm((f) => ({ ...f, body: e.target.value }))} placeholder="Metin" rows={3} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yayınla'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowDuyuruForm(false)}>İptal</Button>
              </div>
            </form>
          )}
          {loadingAnn ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Henüz duyuru yok. Yeni duyuru ekleyebilirsiniz.</p>
          ) : (
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li key={a.id} className="border-b pb-3 last:border-0">
                  <p className="font-medium text-foreground">{a.title}</p>
                  {a.body && <p className="text-sm text-muted-foreground mt-1">{a.body}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString('tr-TR')}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Anketler */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Anketler
            </CardTitle>
            <CardDescription>Anket oluşturun, veli geri bildirimi alın</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAnketForm(!showAnketForm)}>
            <Plus className="h-4 w-4 mr-1" />
            Anket oluştur
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAnketForm && (
            <form onSubmit={handleAnketSubmit} className="rounded-lg border p-4 space-y-3">
              <div>
                <Label>Anket başlığı</Label>
                <Input value={anketForm.title} onChange={(e) => setAnketForm((f) => ({ ...f, title: e.target.value }))} placeholder="Örn. Memnuniyet anketi" required />
              </div>
              <div>
                <Label>Açıklama (isteğe bağlı)</Label>
                <Textarea value={anketForm.description} onChange={(e) => setAnketForm((f) => ({ ...f, description: e.target.value }))} placeholder="Kısa açıklama" rows={2} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Oluştur'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowAnketForm(false)}>İptal</Button>
              </div>
            </form>
          )}
          {loadingSur ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : surveys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Henüz anket yok. Anket oluşturup velilere açabilirsiniz.</p>
          ) : (
            <ul className="space-y-2">
              {surveys.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.status} · {new Date(s.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Eğitmen–veli mesajlaşma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Eğitmen–veli mesajlaşma
          </CardTitle>
          <CardDescription>Antrenör ile veli arasında mesajlaşma. Veliler kendi panelinde Mesajlar sayfasından ulaşır; tesis tarafında konuşma listesi yakında eklenecek.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Veli paneli: <Link href="/veli/mesajlar" className="text-primary underline">/veli/mesajlar</Link> — Antrenör ile iletişim burada yönetilir.</p>
        </CardContent>
      </Card>
    </div>
  )
}
