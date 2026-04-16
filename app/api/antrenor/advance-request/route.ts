/**
 * Antrenör avans talebi — Session/doğrulama path'i: /api/antrenor/advance-request
 * avans-talebi/route.ts ile aynı davranış, try/catch wrapper ile güvenli.
 */
import { NextRequest, NextResponse } from 'next/server'
import { GET as delegatedGET, POST as delegatedPOST, dynamic } from '../avans-talebi/route'

export { dynamic }

export async function GET(req: NextRequest) {
  try {
    return await delegatedGET(req)
  } catch {
    return NextResponse.json({ items: [], error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    return await delegatedPOST(req)
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
