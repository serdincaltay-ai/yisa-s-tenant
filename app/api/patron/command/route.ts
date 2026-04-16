import { tenantScopeGoneResponse } from '@/lib/system/scope-guard'

export async function POST() {
  return tenantScopeGoneResponse('Patron komut çalıştırma', '/api/patron/command')
}
