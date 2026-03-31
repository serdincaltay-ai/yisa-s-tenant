/**
 * Tek tuşla migration — DATABASE_URL ile db:full-migrate çalıştırır
 * Sadece Patron / yetkili kullanıcılar çağırabilir
 */

import { NextResponse } from 'next/server'
import { requirePatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

const MIGRATION_SQL = `
-- athlete_health_records
CREATE TABLE IF NOT EXISTS athlete_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL DEFAULT 'genel',
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_athlete_health_athlete ON athlete_health_records(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_health_recorded_at ON athlete_health_records(recorded_at);

-- celf_kasa
CREATE TABLE IF NOT EXISTS celf_kasa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hareket_tipi TEXT NOT NULL CHECK (hareket_tipi IN ('gelir', 'gider')),
  aciklama TEXT NOT NULL,
  tutar DECIMAL(12,2) NOT NULL,
  para_birimi VARCHAR(3) DEFAULT 'TRY',
  referans_tipi TEXT,
  referans_id UUID,
  franchise_id UUID,
  tenant_id UUID,
  kaynak TEXT,
  odeme_tarihi TIMESTAMPTZ,
  odeme_onaylandi BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_celf_kasa_hareket_tipi ON celf_kasa(hareket_tipi);
CREATE INDEX IF NOT EXISTS idx_celf_kasa_created_at ON celf_kasa(created_at DESC);

-- tenant ayarları
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS antrenor_hedef INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS temizlik_hedef INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mudur_hedef INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS aidat_tiers JSONB DEFAULT '{"25": 500, "45": 700, "60": 900}'::jsonb;

-- tenant_schedule
CREATE TABLE IF NOT EXISTS tenant_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  gun TEXT NOT NULL,
  saat TEXT NOT NULL,
  ders_adi TEXT NOT NULL,
  antrenor_id UUID,
  brans TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_schedule_tenant ON tenant_schedule(tenant_id);

-- tenant_purchases
CREATE TABLE IF NOT EXISTS tenant_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_key TEXT NOT NULL,
  product_name TEXT,
  amount DECIMAL(12,2) NOT NULL,
  para_birimi VARCHAR(3) DEFAULT 'TRY',
  celf_kasa_id UUID,
  odeme_onaylandi BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_purchases_tenant ON tenant_purchases(tenant_id);
`

export async function POST() {
  try {
    const auth = await requirePatron()
    if (auth instanceof NextResponse) return auth

    const dbUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL
    if (!dbUrl) {
      return NextResponse.json({
        ok: false,
        error: 'DATABASE_URL veya SUPABASE_DB_URL gerekli. .env.local dosyasına ekleyin.',
      }, { status: 503 })
    }

    const pg = await import('pg')
    const client = new pg.default.Client({ connectionString: dbUrl })
    await client.connect()

    try {
      await client.query(MIGRATION_SQL)
      return NextResponse.json({
        ok: true,
        message: 'Migration tamamlandı. athlete_health_records, celf_kasa, tenant_schedule, tenant_purchases hazır.',
      })
    } finally {
      await client.end()
    }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({
      ok: false,
      error: 'Migration hatası: ' + err,
    }, { status: 500 })
  }
}
