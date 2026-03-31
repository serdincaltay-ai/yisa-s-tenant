import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

/**
 * Veli-antrenor mesajlasma API (realtime destekli).
 * GET: Konusma listesi (partner antrenorler) veya tek konusma mesajlari
 * POST: Mesaj gonder
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    const { searchParams } = new URL(req.url)
    const partnerId = searchParams.get('partner_id')

    if (partnerId && tenantId) {
      // Tek konusma mesajlari
      const { data: messages, error } = await supabase
        .from('veli_coach_messages')
        .select('*')
        .eq('tenant_id', tenantId)
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[veli/messages GET]', error)
        return NextResponse.json({ messages: [] })
      }

      return NextResponse.json({ messages: messages ?? [] })
    }

    // Konusma listesi: velinin cocuklarinin antrenorlerini bul
    if (!tenantId) {
      return NextResponse.json({ partners: [] })
    }

    // Velinin cocuklarini bul
    const { data: athletes } = await supabase
      .from('athletes')
      .select('id, name, surname, coach_user_id')
      .eq('tenant_id', tenantId)
      .eq('parent_user_id', user.id)

    if (!athletes || athletes.length === 0) {
      return NextResponse.json({ partners: [] })
    }

    // Benzersiz antrenor ID'lerini topla
    const coachIds = [...new Set(
      athletes
        .map((a) => a.coach_user_id)
        .filter((id): id is string => !!id)
    )]

    // Her antrenor icin son mesaj bilgisini getir
    const partners = await Promise.all(
      coachIds.map(async (coachId) => {
        const athleteNames = athletes
          .filter((a) => a.coach_user_id === coachId)
          .map((a) => [a.name, a.surname].filter(Boolean).join(' '))

        // Son mesaji getir
        const { data: lastMsg } = await supabase
          .from('veli_coach_messages')
          .select('content, created_at, sender_id')
          .eq('tenant_id', tenantId)
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${coachId}),and(sender_id.eq.${coachId},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Okunmamis mesaj sayisi
        const { count } = await supabase
          .from('veli_coach_messages')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('sender_id', coachId)
          .eq('receiver_id', user.id)
          .eq('is_read', false)

        // Antrenor adini staff tablosundan al
        const { data: staffData } = await supabase
          .from('staff')
          .select('name, surname')
          .eq('user_id', coachId)
          .eq('tenant_id', tenantId)
          .single()

        const coachName = staffData
          ? [staffData.name, staffData.surname].filter(Boolean).join(' ')
          : 'Antrenor'

        return {
          id: coachId,
          name: coachName,
          athletes: athleteNames,
          last_message: lastMsg?.content ?? null,
          last_message_at: lastMsg?.created_at ?? null,
          last_message_from_me: lastMsg?.sender_id === user.id,
          unread_count: count ?? 0,
        }
      })
    )

    return NextResponse.json({ partners, tenant_id: tenantId })
  } catch (e) {
    console.error('[veli/messages GET]', e)
    return NextResponse.json({ partners: [], messages: [], tenant_id: null })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 400 })

    const body = await req.json()
    const receiverId = body.receiver_id as string | undefined
    const content = typeof body.content === 'string' ? body.content.trim() : ''

    if (!receiverId) return NextResponse.json({ error: 'Alıcı belirtilmedi' }, { status: 400 })
    if (!content) return NextResponse.json({ error: 'Mesaj metni zorunludur' }, { status: 400 })

    const { data, error } = await supabase
      .from('veli_coach_messages')
      .insert({
        tenant_id: tenantId,
        sender_id: user.id,
        receiver_id: receiverId,
        content,
      })
      .select()
      .single()

    if (error) {
      console.error('[veli/messages POST]', error)
      return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: data })
  } catch (e) {
    console.error('[veli/messages POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
