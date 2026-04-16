import { tenantScopeGoneResponse } from '@/lib/system/scope-guard'

export async function GET() {
  return tenantScopeGoneResponse('Patron komut kuyruğu')
}
