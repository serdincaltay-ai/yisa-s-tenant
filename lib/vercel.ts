/**
 * Vercel API — Proje domain ekleme (franchise subdomain için)
 * VERCEL_TOKEN ve VERCEL_PROJECT (opsiyonel) env gerekli
 */

const VERCEL_API = 'https://api.vercel.com'

export type AddDomainResult =
  | { ok: true; verified?: boolean }
  | { ok: false; error: string }

/**
 * Vercel projesine domain ekle
 * @param domain Örn: madamfavori.yisa-s.com
 */
export async function addVercelDomain(domain: string): Promise<AddDomainResult> {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    return { ok: false, error: 'VERCEL_TOKEN tanımlı değil' }
  }

  const project = process.env.VERCEL_PROJECT || 'yisa-s-app'
  const teamId = process.env.VERCEL_TEAM_ID

  const url = new URL(`${VERCEL_API}/v10/projects/${encodeURIComponent(project)}/domains`)
  if (teamId) url.searchParams.set('teamId', teamId)

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    })

    const data = (await res.json()) as { error?: { message?: string }; verified?: boolean }

    if (!res.ok) {
      const msg = data.error?.message || `HTTP ${res.status}`
      // Zaten ekliyse hata verme, başarılı say
      if (res.status === 400 && /already|exists|assigned/i.test(msg)) {
        return { ok: true, verified: true }
      }
      return { ok: false, error: msg }
    }

    return { ok: true, verified: data.verified ?? false }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}
