#!/usr/bin/env node
/**
 * Tablo sayılarını SQL ile raporla
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
  console.log('SUPABASE_DB_URL yok, API sayıları kullanılacak.')
  process.exit(0)
}

async function run() {
  try {
    const pg = require('pg')
    const client = new pg.Client({ connectionString: dbUrl })
    await client.connect()
    const res = await client.query(`
      select 'user_tenants' as t, count(*)::text from user_tenants
      union all select 'athletes', count(*)::text from athletes
      union all select 'attendance', count(*)::text from attendance
      union all select 'payments', count(*)::text from payments
      union all select 'cash_register', count(*)::text from cash_register
    `)
    await client.end()
    console.log('\n=== SQL RAPOR ===')
    res.rows.forEach((r) => console.log(`  ${r.t}: ${r.count}`))
  } catch (e) {
    console.log('SQL çalıştırılamadı:', e.message)
  }
}
run()
