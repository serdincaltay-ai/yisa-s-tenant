/**
 * GET /api/notifications/vapid-key
 * VAPID public key'i döndürür (client tarafında subscription oluşturmak için)
 */

import { NextResponse } from 'next/server'
import { getVapidPublicKey } from '@/lib/notifications/web-push'

export const dynamic = 'force-dynamic'

export async function GET() {
  const publicKey = getVapidPublicKey()

  if (!publicKey) {
    return NextResponse.json(
      { error: 'VAPID anahtarı yapılandırılmamış' },
      { status: 503 }
    )
  }

  return NextResponse.json({ publicKey })
}
