import { tenantScopeGoneResponse } from '@/lib/system/scope-guard'

export async function POST() {
  return tenantScopeGoneResponse('CELF subdomain yönetimi', '/api/patron/command')
}
