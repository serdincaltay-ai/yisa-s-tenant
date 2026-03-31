#!/usr/bin/env node
/**
 * YİSA-S TAM SİSTEM MİGRASYON — Tüm SQL dosyalarını sırayla çalıştırır
 * DATABASE_URL gerekli (.env.local)
 * Çalıştırma: node scripts/run-full-migrations.js
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

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
if (!dbUrl) {
  console.error(`
DATABASE_URL gerekli. .env.local dosyasına ekleyin:
  DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres

Alternatif: supabase/SISTEM_AKTIF_KURULUM.sql dosyasını Supabase SQL Editor'da çalıştırın.
`)
  process.exit(1)
}

const supabaseDir = path.join(__dirname, '..', 'supabase')
const migrationsDir = path.join(supabaseDir, 'migrations')

const SQL_FILES = [
  path.join(supabaseDir, 'YISA-S_TUM_TABLOLAR_TEK_SQL.sql'),
  path.join(supabaseDir, 'YENI_MIGRASYONLAR_TEK_SQL.sql'),
  path.join(supabaseDir, 'RUN_ROBOTS_CELF_ONLY.sql'),
  path.join(migrationsDir, '20260203_ceo_templates_ve_sablonlar.sql'),
  path.join(migrationsDir, '20260204_ceo_templates_columns.sql'),
  path.join(supabaseDir, 'SABLONLAR_TEK_SQL.sql'),
  path.join(migrationsDir, '20260203_patron_commands_komut_sonuc_durum.sql'),
  path.join(migrationsDir, '20260130_ceo_tasks_awaiting_approval.sql'),
  path.join(migrationsDir, '20260130_ceo_tasks_idempotency.sql'),
  path.join(migrationsDir, '20260204_athlete_health_records.sql'),
  path.join(migrationsDir, '20260204_celf_kasa.sql'),
  path.join(migrationsDir, '20260204_tenant_settings_schedule.sql'),
  path.join(migrationsDir, '20260204_rls_celf_kasa_tenant_purchases_patron_commands.sql'),
  path.join(migrationsDir, '20260204_staff_extended_fields.sql'),
  path.join(migrationsDir, '20260204_coo_depo_drafts_approved_published.sql'),
  path.join(migrationsDir, '20260205_ticket_no.sql'),
  path.join(migrationsDir, '20260205_patron_commands_extended.sql'),
  path.join(migrationsDir, '20260206_franchise_subdomains.sql'),
]

async function run() {
  const pg = require('pg')
  const client = new pg.Client({ connectionString: dbUrl })
  try {
    await client.connect()
    console.log('Supabase bağlantısı OK.\n')

    for (const filePath of SQL_FILES) {
      const name = path.basename(filePath)
      if (!fs.existsSync(filePath)) {
        console.log(`[ATLA] ${name} (dosya yok)`)
        continue
      }
      const sql = fs.readFileSync(filePath, 'utf8')
      try {
        await client.query(sql)
        console.log(`[OK] ${name}`)
      } catch (err) {
        if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
          console.log(`[OK] ${name} (zaten var)`)
        } else {
          console.error(`[HATA] ${name}:`, err.message)
          throw err
        }
      }
    }

    const res = await client.query(`
      SELECT 'robots' AS tablo, COUNT(*)::int AS n FROM robots
      UNION ALL SELECT 'celf_directorates', COUNT(*)::int FROM celf_directorates
      UNION ALL SELECT 'ceo_templates', COUNT(*)::int FROM ceo_templates
      UNION ALL SELECT 'patron_commands', COUNT(*)::int FROM patron_commands
    `)
    console.log('\n--- Özet ---')
    res.rows.forEach((r) => console.log(`  ${r.tablo}: ${r.n}`))
    console.log('\nTam sistem migration tamamlandı.')
  } catch (err) {
    console.error('Migration hatası:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
