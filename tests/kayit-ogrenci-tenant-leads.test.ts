import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const getUser = vi.fn()
  const getTenantIdWithFallback = vi.fn()
  const sendSMS = vi.fn()
  const isSmsConfigured = vi.fn(() => false)
  const service = { from: vi.fn() }
  const createServiceClient = vi.fn(() => service)
  const createClient = vi.fn(async () => ({ auth: { getUser } }))
  return {
    getUser,
    getTenantIdWithFallback,
    sendSMS,
    isSmsConfigured,
    service,
    createServiceClient,
    createClient,
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createServiceClient,
}))

vi.mock('@/lib/franchise-tenant', () => ({
  getTenantIdWithFallback: mocks.getTenantIdWithFallback,
}))

vi.mock('@/lib/sms/provider', () => ({
  sendSMS: mocks.sendSMS,
  isSmsConfigured: mocks.isSmsConfigured,
}))

import { POST } from '@/app/api/kayit/ogrenci/route'

function mockFromMap(map: Record<string, unknown>) {
  mocks.service.from.mockImplementation((table: string) => {
    const value = map[table]
    if (!value) throw new Error(`Unexpected table: ${table}`)
    return value
  })
}

describe('/api/kayit/ogrenci tenant_leads insert smoke', () => {
  it('inserts into tenant_leads and still returns ok', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mocks.getTenantIdWithFallback.mockResolvedValue('tenant-1')

    const userTenantsQuery = {
      select: vi.fn(() => userTenantsQuery),
      eq: vi.fn(() => userTenantsQuery),
      maybeSingle: vi.fn(async () => ({ data: { role: 'kayit_gorevlisi' } })),
    }

    const athletesInsertQuery = {
      insert: vi.fn(() => athletesInsertQuery),
      select: vi.fn(() => athletesInsertQuery),
      single: vi.fn(async () => ({
        data: { id: 'athlete-1', name: 'Ali', surname: 'Yilmaz' },
        error: null,
      })),
    }

    const packagePaymentsInsertQuery = {
      insert: vi.fn(() => packagePaymentsInsertQuery),
      select: vi.fn(() => packagePaymentsInsertQuery),
      single: vi.fn(async () => ({
        data: { id: 'payment-1', amount: 1200, status: 'bekliyor' },
        error: null,
      })),
    }

    const tenantLeadsInsertQuery = {
      insert: vi.fn(async () => ({ data: null, error: null })),
    }

    mockFromMap({
      user_tenants: userTenantsQuery,
      athletes: athletesInsertQuery,
      package_payments: packagePaymentsInsertQuery,
      tenant_leads: tenantLeadsInsertQuery,
    })

    const req = {
      json: async () => ({
        ad: 'Ali',
        soyad: 'Yilmaz',
        veli_ad: 'Ayse Yilmaz',
        veli_telefon: '',
        veli_email: 'ayse@example.com',
        aidat_tutar: 1200,
      }),
    } as unknown as Request

    const res = await POST(req as never)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(tenantLeadsInsertQuery.insert).toHaveBeenCalledTimes(1)
    expect(tenantLeadsInsertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-1',
        ad_soyad: 'Ayse Yilmaz',
        durum: 'kazanildi',
      })
    )
  })
})
