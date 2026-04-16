import { tenantScopeGoneResponse } from '@/lib/system/scope-guard'

export async function POST() {
  return tenantScopeGoneResponse('CELF API', '/api/celf/route.ts')
}

export async function GET() {
  return tenantScopeGoneResponse('CELF API', '/api/celf/route.ts')
}
