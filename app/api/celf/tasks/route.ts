import { tenantScopeGoneResponse } from '@/lib/system/scope-guard'

export const dynamic = 'force-dynamic'

export async function POST() {
  return tenantScopeGoneResponse('CELF görev yönetimi')
}
