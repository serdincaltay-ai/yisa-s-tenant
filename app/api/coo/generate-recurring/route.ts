/**
 * GET /api/coo/generate-recurring
 * Cron ile aylik cagirilir — aktif recurring_expenses kayitlarindan
 * otomatik gider satirlari olusturur (cash_register'a yazar).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireCronOrPatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

interface RecurringExpense {
  id: string
  tenant_id: string
  title: string
  category: string
  amount: number
  currency: string
  frequency: string
  due_day: number
  start_date: string
  end_date: string | null
  is_active: boolean
  last_generated_date: string | null
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireCronOrPatron(req)
    if (auth instanceof NextResponse) return auth

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Sunucu yapilandirma hatasi' }, { status: 500 })
    }

    const service = createServiceClient(url, key)

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const todayStr = now.toISOString().slice(0, 10)

    // Aktif recurring expenses'lari getir
    const { data: expenses, error: fetchErr } = await service
      .from('recurring_expenses')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', todayStr)

    if (fetchErr) {
      console.error('[generate-recurring] Sorgu hatasi:', fetchErr.message)
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    if (!expenses || expenses.length === 0) {
      return NextResponse.json({ ok: true, generated: 0, message: 'Aktif sabit odeme yok' })
    }

    const typedExpenses = expenses as RecurringExpense[]

    let generated = 0
    let skipped = 0

    for (const expense of typedExpenses) {
      // end_date kontrolu
      if (expense.end_date && expense.end_date < todayStr) {
        skipped++
        continue
      }

      // Bu ay icin zaten olusturulmus mu?
      if (expense.last_generated_date) {
        const lastGen = new Date(expense.last_generated_date)
        const lastGenYear = lastGen.getFullYear()
        const lastGenMonth = lastGen.getMonth() + 1

        if (expense.frequency === 'monthly' && lastGenYear === currentYear && lastGenMonth === currentMonth) {
          skipped++
          continue
        }
        if (expense.frequency === 'quarterly') {
          const currentQuarter = Math.ceil(currentMonth / 3)
          const lastGenQuarter = Math.ceil(lastGenMonth / 3)
          if (lastGenYear === currentYear && lastGenQuarter === currentQuarter) {
            skipped++
            continue
          }
        }
        if (expense.frequency === 'yearly' && lastGenYear === currentYear) {
          skipped++
          continue
        }
      }

      // cash_register'a gider kaydi olustur
      const dueDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(expense.due_day).padStart(2, '0')}`

      // Once last_generated_date'i guncelle (duplicate onleme)
      const prevDate = expense.last_generated_date
      const { error: updateErr } = await service
        .from('recurring_expenses')
        .update({ last_generated_date: todayStr, updated_at: new Date().toISOString() })
        .eq('id', expense.id)

      if (updateErr) {
        console.error(`[generate-recurring] Guncelleme hatasi (${expense.id}):`, updateErr.message)
        skipped++
        continue
      }

      const { error: insertErr } = await service.from('cash_register').insert({
        tenant_id: expense.tenant_id,
        tarih: dueDateStr,
        tur: 'gider',
        kategori: expense.category,
        aciklama: `Sabit ödeme: ${expense.title}`,
        tutar: expense.amount,
        odeme_yontemi: 'havale',
      })

      if (insertErr) {
        console.error(`[generate-recurring] Kayit hatasi (${expense.id}):`, insertErr.message)
        // Rollback last_generated_date
        await service
          .from('recurring_expenses')
          .update({ last_generated_date: prevDate, updated_at: new Date().toISOString() })
          .eq('id', expense.id)
        skipped++
        continue
      }

      generated++
    }

    return NextResponse.json({
      ok: true,
      generated,
      skipped,
      toplam: typedExpenses.length,
      tarih: todayStr,
    })
  } catch (e) {
    console.error('[generate-recurring]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
