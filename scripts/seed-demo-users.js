#!/usr/bin/env node
/**
 * Demo kullanıcıları ve seed verisi oluştur
 * .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs')
const path = require('path')

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) {
        const key = m[1].trim()
        const val = m[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) process.env[key] = val
      }
    }
  }
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('HATA: .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.')
  process.exit(1)
}

const TENANT_ID = '8cc3ea1d-27a0-496e-a0fb-1625be7a9b35'
const PASSWORD = 'Demo1234!'
const BUGUN = new Date().toISOString().slice(0, 10)

async function main() {
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  const users = [
    { email: 'owner@demo.com', role: 'admin' },
    { email: 'mudur@demo.com', role: 'tesis_muduru' },
    { email: 'coach@demo.com', role: 'antrenor' },
    { email: 'kayit@demo.com', role: 'sekreter' },
  ]

  const createdIds = {}

  // 1) Auth kullanıcıları oluştur
  console.log('1) Auth kullanıcıları oluşturuluyor...')
  for (const u of users) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: PASSWORD,
        email_confirm: true,
      })
      if (error) {
        if (error.message?.includes('already been registered')) {
          const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
          const existing = list?.users?.find((x) => x.email === u.email)
          if (existing) createdIds[u.email] = existing.id
        }
        if (!createdIds[u.email]) throw error
      } else if (data?.user) {
        createdIds[u.email] = data.user.id
      }
    } catch (e) {
      console.error(`  ${u.email}:`, e.message)
      if (!createdIds[u.email]) process.exit(1)
    }
  }
  console.log('  Tamam. IDler:', Object.keys(createdIds).map((e) => `${e}=${createdIds[e]?.slice(0, 8)}...`).join(', '))

  // 2) user_tenants
  console.log('2) user_tenants atanıyor...')
  for (const u of users) {
    const uid = createdIds[u.email]
    if (!uid) continue
    const { error } = await supabase.from('user_tenants').upsert(
      { user_id: uid, tenant_id: TENANT_ID, role: u.role },
      { onConflict: 'user_id,tenant_id' }
    )
    if (error) console.error(`  ${u.email}:`, error.message)
  }
  console.log('  Tamam.')

  const coachId = createdIds['coach@demo.com']

  // 3) athletes
  console.log('3) Athletes ekleniyor...')
  const athletesData = [
    { name: 'Ali', surname: 'Yılmaz', birth_date: '2017-05-12', gender: 'E', branch: 'jimnastik', status: 'active', ders_kredisi: 20, toplam_kredi: 20, coach_user_id: coachId },
    { name: 'Elif', surname: 'Kaya', birth_date: '2016-11-03', gender: 'K', branch: 'jimnastik', status: 'active', ders_kredisi: 15, toplam_kredi: 20, coach_user_id: coachId },
    { name: 'Mert', surname: 'Demir', birth_date: '2018-02-21', gender: 'E', branch: 'jimnastik', status: 'active', ders_kredisi: 10, toplam_kredi: 10, coach_user_id: coachId },
  ]
  const athleteIds = []
  for (const a of athletesData) {
    const row = { tenant_id: TENANT_ID, ...a }
    const { data, error } = await supabase.from('athletes').insert(row).select('id').single()
    if (error) {
      console.error('  Athlete insert:', error.message)
    } else if (data?.id) {
      athleteIds.push(data.id)
    }
  }
  console.log('  Tamam. Eklenen:', athleteIds.length)

  // 4) attendance
  console.log('4) Attendance ekleniyor...')
  for (const aid of athleteIds) {
    const { error } = await supabase.from('attendance').upsert(
      { tenant_id: TENANT_ID, athlete_id: aid, lesson_date: BUGUN, status: 'present', marked_by: coachId },
      { onConflict: 'tenant_id,athlete_id,lesson_date' }
    )
    if (error) console.error('  Attendance:', error.message)
  }
  console.log('  Tamam.')

  // 5) payments
  console.log('5) Payments ekleniyor...')
  if (athleteIds.length >= 2) {
    const payRows = [
      { tenant_id: TENANT_ID, athlete_id: athleteIds[0], amount: 500, payment_type: 'aidat', status: 'paid', payment_method: 'nakit', paid_date: BUGUN },
      { tenant_id: TENANT_ID, athlete_id: athleteIds[1], amount: 700, payment_type: 'aidat', status: 'paid', payment_method: 'nakit', paid_date: BUGUN },
    ]
    for (const p of payRows) {
      const { error } = await supabase.from('payments').insert(p)
      if (error) console.error('  Payment:', error.message)
    }
  }
  console.log('  Tamam.')

  // 6) cash_register
  console.log('6) Cash_register ekleniyor...')
  const cashRows = [
    { tenant_id: TENANT_ID, tarih: BUGUN, tur: 'gelir', kategori: 'aidat', tutar: 500, odeme_yontemi: 'nakit', aciklama: 'Demo aidat' },
    { tenant_id: TENANT_ID, tarih: BUGUN, tur: 'gelir', kategori: 'aidat', tutar: 700, odeme_yontemi: 'nakit', aciklama: 'Demo aidat' },
  ]
  for (const c of cashRows) {
    const { error } = await supabase.from('cash_register').insert(c)
    if (error) console.error('  Cash_register:', error.message)
  }
  console.log('  Tamam.')

  // Sonuç SQL
  console.log('\n7) Tablo sayıları...')
  const tables = ['user_tenants', 'athletes', 'attendance', 'payments', 'cash_register']
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID)
    if (t === 'user_tenants') {
      const { count: c2 } = await supabase.from(t).select('*', { count: 'exact', head: true })
      console.log(`  ${t}: ${c2 ?? '?'}`)
    } else {
      console.log(`  ${t}: ${count ?? '?'}`)
    }
  }

  const { data: ut } = await supabase.from('user_tenants').select('id', { count: 'exact', head: true })
  const { count: utCount } = await supabase.from('user_tenants').select('*', { count: 'exact', head: true })
  const { count: aCount } = await supabase.from('athletes').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID)
  const { count: attCount } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID)
  const { count: pCount } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID)
  const { count: crCount } = await supabase.from('cash_register').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID)

  console.log('\n=== RAPOR ===')
  console.log('user_tenants:', utCount ?? '?')
  console.log('athletes:', aCount ?? '?')
  console.log('attendance:', attCount ?? '?')
  console.log('payments:', pCount ?? '?')
  console.log('cash_register:', crCount ?? '?')

  console.log('\nDemo kullanıcıları (şifre: Demo1234!):')
  users.forEach((u) => console.log(`  ${u.email} → ${u.role}`))
}

main().catch((e) => {
  console.error('HATA:', e)
  process.exit(1)
})
