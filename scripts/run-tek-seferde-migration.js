#!/usr/bin/env node
/**
 * YİSA-S — TEK_SEFERDE_YENI_MIGRASYONLAR.sql çalıştırır
 * DATABASE_URL gerekli (.env.local veya ortam değişkeni)
 * Kullanım: node scripts/run-tek-seferde-migration.js
 * veya: npm run db:tek-seferde
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

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL
if (!dbUrl) {
  console.error(`
DATABASE_URL gerekli. .env.local dosyasına ekleyin:

  DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

Supabase: Settings → Database → Connection string → URI

Alternatif: Supabase SQL Editor'da supabase/TEK_SEFERDE_YENI_MIGRASYONLAR.sql dosyasını açıp Run.
`)
  process.exit(1)
}

const sqlPath = path.join(__dirname, '..', 'supabase', 'TEK_SEFERDE_YENI_MIGRASYONLAR.sql')
if (!fs.existsSync(sqlPath)) {
  console.error('Dosya bulunamadı:', sqlPath)
  process.exit(1)
}

const sql = fs.readFileSync(sqlPath, 'utf8')

async function run() {
  const pg = require('pg')
  const client = new pg.Client({ connectionString: dbUrl })
  try {
    await client.connect()
    console.log('Veritabanı bağlantısı OK.')
    console.log('TEK_SEFERDE_YENI_MIGRASYONLAR.sql çalıştırılıyor...\n')
    await client.query(sql)
    console.log('Migration tamamlandı.')
  } catch (err) {
    console.error('Hata:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
