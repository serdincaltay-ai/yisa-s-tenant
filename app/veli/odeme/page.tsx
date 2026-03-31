'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, XCircle } from 'lucide-react'

type PaymentItem = {
  id: string
  athlete_id: string
  athlete_name: string
  amount: number
  payment_type: string
  period_month?: number
  period_year?: number
  due_date?: string | null
  status: string
}

export default function VeliOdemePage() {
  const searchParams = useSearchParams()
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [totalDebt, setTotalDebt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const callbackStatus = searchParams.get('status')

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/veli/payments')
      const data = await res.json()
      setPayments(Array.isArray(data?.items) ? data.items : [])
      setTotalDebt(Number(data?.totalDebt) || 0)
    } catch {
      setPayments([])
      setTotalDebt(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const pending = payments.filter((p) => p.status === 'pending' || p.status === 'overdue')

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const selectAll = () => {
    if (selectedIds.size >= pending.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pending.map((p) => p.id)))
    }
  }

  const handleStripeCheckout = async () => {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : pending.map((p) => p.id)
    if (ids.length === 0) return

    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_ids: ids }),
      })
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      } else {
        alert(data?.error ?? 'Stripe checkout oluşturulamadı')
      }
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const selectedTotal = pending
    .filter((p) => selectedIds.has(p.id))
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-white p-4 pb-24">
      <header className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/veli/dashboard"><ArrowLeft className="h-4 w-4" /> Geri</Link>
        </Button>
      </header>

      {callbackStatus === 'success' && (
        <Card className="border-green-500/50 bg-green-50 mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Ödeme başarıyla tamamlandı!</p>
              <p className="text-sm text-green-700">Ödemeniz işlendi. Aidat durumunuz kısa sürede güncellenecektir.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {callbackStatus === 'cancel' && (
        <Card className="border-amber-500/50 bg-amber-50 mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-6 w-6 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Ödeme iptal edildi</p>
              <p className="text-sm text-amber-700">Ödeme işlemi tamamlanmadı. Tekrar deneyebilirsiniz.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <h1 className="text-xl font-bold text-gray-900 mb-2">Online Aidat Ödeme</h1>
      <p className="text-sm text-gray-600 mb-6">Stripe ile güvenli online ödeme. Bekleyen aidatlarınızı kartınızla ödeyebilirsiniz.</p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" /></div>
      ) : (
        <>
          <Card className="border-gray-200 mb-6">
            <CardHeader>
              <CreditCard className="h-8 w-8 text-[#2563eb]" />
              <CardTitle>Bekleyen aidatlar</CardTitle>
              <CardDescription>Ödeme yapılmamış aidatlar listelenir. Stripe ile online ödeyebilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pending.length === 0 ? (
                <p className="text-sm text-gray-600">Bekleyen aidatınız yok.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Toplam borç: {totalDebt.toLocaleString('tr-TR')} TL</p>
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      {selectedIds.size >= pending.length ? 'Seçimi kaldır' : 'Tümünü seç'}
                    </Button>
                  </div>
                  <ul className="space-y-2">
                    {pending.map((p) => (
                      <li
                        key={p.id}
                        className={`flex items-center justify-between py-3 px-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedIds.has(p.id)
                            ? 'border-[#2563eb] bg-blue-50'
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleSelect(p.id)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="h-4 w-4 rounded border-gray-300 text-[#2563eb]"
                          />
                          <div>
                            <span className="text-sm font-medium">{p.athlete_name}</span>
                            <span className="text-sm text-gray-500 ml-2">{p.period_month}/{p.period_year}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.status === 'overdue' && <Badge className="bg-red-500/20 text-red-600 text-xs">Gecikmiş</Badge>}
                          <span className="font-medium">{p.amount.toLocaleString('tr-TR')} TL</span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {selectedIds.size > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-sm font-medium">{selectedIds.size} aidat seçili: {selectedTotal.toLocaleString('tr-TR')} TL</p>
                    </div>
                  )}

                  <Button
                    onClick={handleStripeCheckout}
                    disabled={checkoutLoading || pending.length === 0}
                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]"
                  >
                    {checkoutLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {selectedIds.size > 0
                      ? `Seçilenleri öde (${selectedTotal.toLocaleString('tr-TR')} TL)`
                      : `Tümünü öde (${totalDebt.toLocaleString('tr-TR')} TL)`
                    }
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-gray-500">
            Stripe üzerinden güvenli ödeme. Kart bilgileriniz Stripe tarafından korunur, sunucularımızda saklanmaz.
          </p>
        </>
      )}
    </div>
  )
}
