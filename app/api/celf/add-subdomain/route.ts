/**
 * Yeni franchise subdomain ekle — Patron veya asistan komutu
 * CELF'te "subdomain ekle: madamfavori" yazınca bu API çağrılabilir
 * VERCEL_TOKEN varsa domain otomatik Vercel'e eklenir
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePatronOrFlow } from '@/lib/auth/api-auth'
import { addFranchiseSubdomain } from '@/lib/db/franchise-subdomains'
import { addVercelDomain } from '@/lib/vercel'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yisa-s.com'

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePatronOrFlow()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const subdomain = typeof body.subdomain === 'string' ? body.subdomain.trim() : ''
    const franchiseName = typeof body.franchise_name === 'string' ? body.franchise_name.trim() : undefined

    if (!subdomain) {
      return NextResponse.json({ error: 'subdomain gerekli' }, { status: 400 })
    }

    const result = await addFranchiseSubdomain({
      subdomain,
      franchise_name: franchiseName,
      created_by: auth.user.id,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const slug = subdomain.toLowerCase().replace(/[^a-z0-9]/g, '')
    const fullDomain = `${slug}.${ROOT_DOMAIN}`

    // Vercel'e otomatik ekle (VERCEL_TOKEN varsa)
    const vercelResult = await addVercelDomain(fullDomain)

    const response: Record<string, unknown> = {
      ok: true,
      subdomain: slug,
      message: `Subdomain eklendi: ${fullDomain}`,
    }

    if (vercelResult.ok) {
      response.vercel_added = true
      response.vercel_note = vercelResult.verified
        ? `${fullDomain} Vercel'e eklendi. DNS: CNAME → cname.vercel-dns.com`
        : `${fullDomain} Vercel'e eklendi. DNS kaydını ekleyin: CNAME → cname.vercel-dns.com`
    } else {
      response.vercel_added = false
      response.vercel_note = `Vercel otomatik eklenemedi: ${'error' in vercelResult ? vercelResult.error : 'unknown'}. Manuel: Vercel → Domains → Add → ${fullDomain}`
    }

    return NextResponse.json(response)
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}
