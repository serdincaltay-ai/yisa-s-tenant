/**
 * v1 CEO API — DEPRECATED (410 Gone)
 *
 * Bu endpoint v2 ile değiştirildi.
 * v2 endpointleri:
 *   POST /api/celf/tasks      → Görev oluştur (celf_tasks tablosuna)
 *   POST /api/chat/flow        → Tam akış (CIO → CEO → CELF → Patron Onay)
 *
 * @see app/api/celf/tasks/route.ts
 * @see app/api/chat/flow/route.ts
 */

import { NextResponse } from 'next/server'

const GONE_RESPONSE = {
  ok: false,
  error: 'Bu endpoint kullanımdan kaldırıldı (v1 deprecated).',
  migration: {
    gorev_olustur: 'POST /api/celf/tasks',
    tam_akis: 'POST /api/chat/flow',
  },
  message: 'Lütfen v2 endpointlerini kullanın.',
}

export async function POST() {
  return NextResponse.json(GONE_RESPONSE, { status: 410 })
}

export async function GET() {
  return NextResponse.json(GONE_RESPONSE, { status: 410 })
}
