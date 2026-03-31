#!/usr/bin/env node
/**
 * Supabase SQL Editor — Kayıtlı Sorguları Listele
 * 377 private sorguyu API ile listeler. Silme API'de yok — Dashboard'dan manuel silinir.
 *
 * Gereksinim: .env.local içinde SUPABASE_ACCESS_TOKEN
 *   → https://supabase.com/dashboard/account/tokens adresinden Personal Access Token oluşturun
 *
 * Kullanım: node scripts/supabase-snippets-list.js
 */

const path = require('path')
const fs = require('fs')

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

const PROJECT_REF = 'bgtuqdkfppcjmtrdsldl'
const token = process.env.SUPABASE_ACCESS_TOKEN

if (!token) {
  console.error(`
HATA: SUPABASE_ACCESS_TOKEN gerekli.

1. https://supabase.com/dashboard/account/tokens adresine gidin
2. "Generate new token" ile yeni token oluşturun
3. .env.local dosyasına ekleyin:
   SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxx

Not: Supabase API snippet SİLME desteklemiyor. Bu script sadece listeler.
Silme işlemi Dashboard üzerinden manuel yapılmalı.
`)
  process.exit(1)
}

async function fetchAllSnippets() {
  const all = []
  let cursor = null
  do {
    const url = new URL('https://api.supabase.com/v1/snippets')
    url.searchParams.set('project_ref', PROJECT_REF)
    url.searchParams.set('limit', '100')
    if (cursor) url.searchParams.set('cursor', cursor)

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      throw new Error(`API hatası: ${res.status} ${await res.text()}`)
    }
    const data = await res.json()
    all.push(...(data.data || []))
    cursor = data.cursor || null
  } while (cursor)
  return all
}

async function main() {
  console.log('Supabase SQL Editor sorguları listeleniyor...\n')
  const snippets = await fetchAllSnippets()
  console.log(`Toplam ${snippets.length} sorgu bulundu.\n`)

  const outPath = path.join(__dirname, '..', 'supabase-snippets-list.txt')
  const lines = snippets.map((s, i) => `${i + 1}. ${s.name} (id: ${s.id})`)
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
  console.log(`Liste kaydedildi: ${outPath}\n`)

  console.log('İlk 20 sorgu:')
  snippets.slice(0, 20).forEach((s, i) => console.log(`  ${i + 1}. ${s.name}`))

  console.log(`
--- SİLME İŞLEMİ ---
Supabase API snippet silmeyi desteklemiyor. Manuel silmek için:

1. https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new adresine gidin
2. Sol menüde "PRIVATE" altındaki her sorguya tıklayın
3. Sağ üstteki ⋮ (üç nokta) menüsünden "Delete" seçin

Veya tüm listeyi görmek için: ${outPath}
`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
