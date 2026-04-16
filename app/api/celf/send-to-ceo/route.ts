import { tenantScopeGoneResponse } from '@/lib/system/scope-guard'

export async function POST() {
  return tenantScopeGoneResponse('CELF → CEO aktarımı', '/api/celf/send-to-ceo')
}
