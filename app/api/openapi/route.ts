/**
 * GET /api/openapi
 * OpenAPI 3.0 spec'ini JSON olarak döner.
 * Swagger UI (/api-docs) bu endpoint'i kullanır.
 */

import { NextResponse } from 'next/server'
import spec from '@/lib/openapi-spec'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  })
}
