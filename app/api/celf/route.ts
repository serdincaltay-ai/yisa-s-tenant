import { tenantScopeGoneResponse } from '@/lib/system/scope-guard'

export async function POST() {
  return tenantScopeGoneResponse('CELF API')
}

export async function GET() {
  return tenantScopeGoneResponse('CELF API')
}
