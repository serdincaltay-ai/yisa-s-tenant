import { tenantScopeGoneResponse } from '@/lib/system/scope-guard'

export async function POST() {
  return tenantScopeGoneResponse('Patron direkt AI')
}
