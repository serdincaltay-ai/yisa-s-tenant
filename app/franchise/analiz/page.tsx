'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { AnalizTip } from '@/app/api/franchise/analiz/route'

const TIP_LABELS: Record<AnalizTip, string> = {
  satis: 'Satış',
  paket: 'Paket Satışları',
  'aylik-aktif': 'Aylık Aktif',
  'aylik-bitecek': 'Aylık Bitecek',
  'gunluk-giris': 'Günlük Giriş',
  'saatlik-giris': 'Saatlik Giriş',
  devamsizlik: 'Devamsızlık',
}

const CHART_COLOR = '#22d3ee' // cyan-400
const PIE_COLORS = ['#22d3ee', '#a78bfa', '#f59e0b', '#10b981', '#ef4444', '#ec4899']

type SatisData = {
  gunluk: Array<{ tarih: string; toplam: number }>
  toplamGelir: number
  odemeTipi: Array<{ ad: string; value: number }>
  odemeYontemi: Array<{ ad: string; value: number }>
}
type PaketData = { paketler: Array<{ paket_adi: string; paket_id: string; satis_sayisi: number; toplam_gelir: number }> }
type AylikAktifData = { aylikAktif: Array<{ ay: string; aktif: number }> }
type AylikBitecekData = { aylikBitecek: Array<{ ay: string; sayi: number }>; toplamBitecek: number }
type GunlukGirisData = { gunluk: Array<{ tarih: string; sayi: number }> }
type SaatlikGirisData = { saatlik: Array<{ saat: string; sayi: number }> }
type DevamsizlikData = {
  devamsizlik: Array<{ athlete_id: string; ad: string; toplam_ders: number; gelmedi: number; oran_yuzde: number }>
}

export default function FranchiseAnalizPage() {
  const [tip, setTip] = useState<AnalizTip>('satis')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SatisData | PaketData | AylikAktifData | AylikBitecekData | GunlukGirisData | SaatlikGirisData | DevamsizlikData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAnaliz = useCallback(async (t: AnalizTip) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/franchise/analiz?tip=${encodeURIComponent(t)}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error ?? 'Veri alınamadı')
        setData(null)
        return
      }
      setData(json)
    } catch {
      setError('Bağlantı hatası')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnaliz(tip)
  }, [tip, fetchAnaliz])

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    color: 'hsl(var(--foreground))',
  }
  const axisTick = { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-800 bg-zinc-900/95 px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/franchise">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-zinc-100">Analiz & Raporlar</h1>
      </header>

      <div className="p-4">
        <Tabs value={tip} onValueChange={(v) => setTip(v as AnalizTip)} className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 bg-zinc-800/80 p-1">
            {(Object.keys(TIP_LABELS) as AnalizTip[]).map((t) => (
              <TabsTrigger key={t} value={t} className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                {TIP_LABELS[t]}
              </TabsTrigger>
            ))}
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
          ) : error ? (
            <Card className="border-zinc-700 bg-zinc-900">
              <CardContent className="p-6 text-destructive">{error}</CardContent>
            </Card>
          ) : (
            <>
              <TabsContent value="satis" className="mt-0 space-y-4">
                {data && 'toplamGelir' in data && (
                  <>
                    <Card className="border-zinc-700 bg-zinc-900">
                      <CardHeader>
                        <CardTitle className="text-cyan-400">Toplam Gelir (Son 30 Gün)</CardTitle>
                        <CardDescription>Ödenen + bekleyen</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-zinc-100">
                          {(data as SatisData).toplamGelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-zinc-700 bg-zinc-900">
                      <CardHeader>
                        <CardTitle>Günlük Satış</CardTitle>
                        <CardDescription>Son 30 gün</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={(data as SatisData).gunluk}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="tarih" tick={axisTick} />
                              <YAxis tick={axisTick} />
                              <Tooltip contentStyle={tooltipStyle} formatter={(value: number | undefined) => [(value ?? 0).toLocaleString('tr-TR') + ' ₺', 'Toplam']} />
                              <Bar dataKey="toplam" name="Toplam" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="border-zinc-700 bg-zinc-900">
                        <CardHeader>
                          <CardTitle>Ödeme Tipi</CardTitle>
                          <CardDescription>aidat, kayıt, ekstra</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={(data as SatisData).odemeTipi}
                                  dataKey="value"
                                  nameKey="ad"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  label={({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                  {(data as SatisData).odemeTipi.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} formatter={(value: number | undefined) => [(value ?? 0).toLocaleString('tr-TR') + ' ₺', '']} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-zinc-700 bg-zinc-900">
                        <CardHeader>
                          <CardTitle>Ödeme Yöntemi</CardTitle>
                          <CardDescription>nakit, kart, havale, eft</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={(data as SatisData).odemeYontemi}
                                  dataKey="value"
                                  nameKey="ad"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  label={({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                  {(data as SatisData).odemeYontemi.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} formatter={(value: number | undefined) => [(value ?? 0).toLocaleString('tr-TR') + ' ₺', '']} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="paket" className="mt-0 space-y-4">
                {data && 'paketler' in data && (
                  <>
                    <Card className="border-zinc-700 bg-zinc-900">
                      <CardHeader>
                        <CardTitle>Paket Bazlı Satış</CardTitle>
                        <CardDescription>Satış sayısı ve toplam gelir</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={(data as PaketData).paketler} layout="vertical" margin={{ left: 80 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis type="number" tick={axisTick} />
                              <YAxis type="category" dataKey="paket_adi" tick={axisTick} width={80} />
                              <Tooltip contentStyle={tooltipStyle} />
                              <Bar dataKey="satis_sayisi" name="Satış sayısı" fill={CHART_COLOR} radius={[0, 4, 4, 0]} />
                              <Bar dataKey="toplam_gelir" name="Toplam gelir (₺)" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-zinc-700 bg-zinc-900">
                      <CardHeader>
                        <CardTitle>Paket Tablosu</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-zinc-700 hover:bg-zinc-800/50">
                              <TableHead className="text-zinc-300">Paket</TableHead>
                              <TableHead className="text-right text-zinc-300">Satış</TableHead>
                              <TableHead className="text-right text-zinc-300">Toplam Gelir</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(data as PaketData).paketler.map((p) => (
                              <TableRow key={p.paket_id} className="border-zinc-700 hover:bg-zinc-800/50">
                                <TableCell className="font-medium text-zinc-100">{p.paket_adi}</TableCell>
                                <TableCell className="text-right text-zinc-300">{p.satis_sayisi}</TableCell>
                                <TableCell className="text-right text-cyan-400">{p.toplam_gelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</TableCell>
                              </TableRow>
                            ))}
                            {(data as PaketData).paketler.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-zinc-500">Paket verisi yok</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="aylik-aktif" className="mt-0">
                {data && 'aylikAktif' in data && (
                  <Card className="border-zinc-700 bg-zinc-900">
                    <CardHeader>
                      <CardTitle>Aylık Aktif Sporcu Trendi</CardTitle>
                      <CardDescription>Son 12 ay — kümülatif kayıt</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={(data as AylikAktifData).aylikAktif}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="ay" tick={axisTick} />
                            <YAxis tick={axisTick} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line type="monotone" dataKey="aktif" name="Aktif" stroke={CHART_COLOR} strokeWidth={2} dot={{ fill: CHART_COLOR }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="aylik-bitecek" className="mt-0">
                {data && 'aylikBitecek' in data && (
                  <Card className="border-zinc-700 bg-zinc-900">
                    <CardHeader>
                      <CardTitle>Önümüzdeki 3 Ay Bitecek Üyelik</CardTitle>
                      <CardDescription>ders_kredisi ≤ 3 tahmini</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={(data as AylikBitecekData).aylikBitecek}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="ay" tick={axisTick} />
                            <YAxis tick={axisTick} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="sayi" name="Sporcu sayısı" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">Toplam: {(data as AylikBitecekData).toplamBitecek} sporcu (kredi ≤ 3)</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="gunluk-giris" className="mt-0">
                {data && 'gunluk' in data && (
                  <Card className="border-zinc-700 bg-zinc-900">
                    <CardHeader>
                      <CardTitle>Günlük Giriş (Yoklama)</CardTitle>
                      <CardDescription>Son 30 gün</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={(data as GunlukGirisData).gunluk}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="tarih" tick={axisTick} />
                            <YAxis tick={axisTick} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="sayi" name="Giriş" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="saatlik-giris" className="mt-0">
                {data && 'saatlik' in data && (
                  <Card className="border-zinc-700 bg-zinc-900">
                    <CardHeader>
                      <CardTitle>Saate Göre Giriş Dağılımı</CardTitle>
                      <CardDescription>08:00–20:00, son 30 gün</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={(data as SaatlikGirisData).saatlik}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="saat" tick={axisTick} />
                            <YAxis tick={axisTick} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="sayi" name="Giriş" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="devamsizlik" className="mt-0">
                {data && 'devamsizlik' in data && (
                  <Card className="border-zinc-700 bg-zinc-900">
                    <CardHeader>
                      <CardTitle>Yüksek Devamsızlık (&gt;%30)</CardTitle>
                      <CardDescription>Son 30 gün — absent oranı</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-700 hover:bg-zinc-800/50">
                            <TableHead className="text-zinc-300">Sporcu</TableHead>
                            <TableHead className="text-right text-zinc-300">Toplam ders</TableHead>
                            <TableHead className="text-right text-zinc-300">Gelmedi</TableHead>
                            <TableHead className="text-right text-zinc-300">Oran %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(data as DevamsizlikData).devamsizlik.map((row) => (
                            <TableRow key={row.athlete_id} className="border-zinc-700 hover:bg-zinc-800/50">
                              <TableCell className="font-medium text-zinc-100">{row.ad}</TableCell>
                              <TableCell className="text-right text-zinc-300">{row.toplam_ders}</TableCell>
                              <TableCell className="text-right text-zinc-300">{row.gelmedi}</TableCell>
                              <TableCell className="text-right text-destructive">{row.oran_yuzde}%</TableCell>
                            </TableRow>
                          ))}
                          {(data as DevamsizlikData).devamsizlik.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-zinc-500">%30 üzeri devamsızlık yok</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}
