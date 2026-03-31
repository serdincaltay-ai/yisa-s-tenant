#!/usr/bin/env node
/**
 * YİSA-S Supabase Migration Runner
 * DATABASE_URL gerekli: Supabase Dashboard → Settings → Database → Connection string (URI)
 * Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
 * Çalıştırma: npm run db:migrate
 */

const fs = require('fs')
const path = require('path')

// .env.local yükle
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

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

if (!dbUrl) {
  console.error(`
YİSA-S Migration: DATABASE_URL gerekli.

1. Supabase Dashboard: https://supabase.com/dashboard/project/bgtuqdkfppcjmtrdsldl
2. Settings → Database → Connection string → URI
3. .env.local dosyasına ekleyin:
   DATABASE_URL=postgresql://postgres.bgtuqdkfppcjmtrdsldl:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

Alternatif: supabase/RUN_ALL_MIGRATIONS.sql dosyasını Supabase SQL Editor'da yapıştırıp Run.
`)
  process.exit(1)
}

async function run() {
  let pg
  try {
    pg = require('pg')
  } catch (e) {
    console.error('pg paketi yok. Çalıştırın: npm install pg --save-dev')
    process.exit(1)
  }

  const sqlPath = path.join(__dirname, '..', 'supabase', 'RUN_ALL_MIGRATIONS.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  const client = new pg.Client({ connectionString: dbUrl })
  try {
    await client.connect()
    console.log('Supabase bağlantısı OK.')

    await client.query(sql)
    console.log('Migration tamamlandı.')

    const res = await client.query(`
      SELECT 'ROBOTLAR' AS tablo, COUNT(*)::int AS sayi FROM robots
      UNION ALL SELECT 'DİREKTÖRLÜKLER', COUNT(*)::int FROM celf_directorates
      UNION ALL SELECT 'ROLLER', COUNT(*)::int FROM role_permissions
      UNION ALL SELECT 'KURALLAR', COUNT(*)::int FROM core_rules
    `)
    if (res.rows?.length) {
      console.log('\nÖzet:')
      res.rows.forEach((r) => console.log(`  ${r.tablo}: ${r.sayi}`))
    }
  } catch (err) {
    console.error('Migration hatası:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
