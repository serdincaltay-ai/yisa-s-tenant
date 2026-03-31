/**
 * YİSA-S Fal.ai Video/Image API
 * FAL_KEY veya FAL_API_KEY .env'de
 */

const FAL_BASE = 'https://fal.run' // Senkron; video uzun sürerse queue.fal.run + polling kullanılabilir

function getKey(): string | undefined {
  const k = process.env.FAL_KEY ?? process.env.FAL_API_KEY
  return typeof k === 'string' ? k.trim() || undefined : undefined
}

export const YISA_SLOGANS = [
  'Teknolojisi spora başlatıyoruz',
  'Teknolojisi spora başlattık',
  'Spor tesislerini teknoloji ve bilimle yönetiyoruz',
  'Çocukların gelişimini veriyle takip ediyoruz',
  'YİSA-S — Yönetici İşletmeci Sporcu Antrenör Sistemi',
  'İlkler ve yeniliklerle — Serdinç Altay',
  'Robot yönetimli spor tesisi franchise',
]

export type FalIntroVideoResult =
  | { ok: true; video_url: string; request_id?: string }
  | { ok: false; error: string }

/**
 * YİSA-S fuar/tanıtım intro videosu — 8 saniye, çocuklara yönelik, teknoloji + spor
 * İlk 4 sn: Geliyoruz tarzı açılış. Son 4 sn: dönen logo. Serdinç Altay, İlkler/Yenilikler.
 */
export async function generateIntroVideo(sloganIndex?: number): Promise<FalIntroVideoResult> {
  const key = getKey()
  if (!key) return { ok: false, error: 'FAL_KEY veya FAL_API_KEY .env içinde tanımlı değil.' }

  const slogan = YISA_SLOGANS[sloganIndex ?? 0] ?? YISA_SLOGANS[0]
  const prompt = `Professional 8-second intro video for YİSA-S children's sports technology brand. 
First 4 seconds: Announcement style — "We are coming" (Geliyoruz) — bold text, energetic motion, building anticipation. 
Next 4 seconds: YİSA-S logo spinning or rotating elegantly on screen. 
Slogan on screen: "${slogan}". 
Text overlay: "Serdinç Altay" — inspirational, minimal. 
Include motivational words: İlkler (Firsts), Yenilikler (Innovations). 
Style: Modern, vibrant, kid-friendly. Clean technology aesthetic. Energetic, professional, suitable for sports fairs. 
16:9 cinematic, no faces.`

  try {
    const res = await fetch(`${FAL_BASE}/fal-ai/veo3.1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${key}`,
      },
      body: JSON.stringify({
        prompt,
        duration: '8s',
        aspect_ratio: '16:9',
        resolution: '720p',
        generate_audio: true,
      }),
    })

    if (!res.ok) {
      const errText = (await res.text()).slice(0, 500)
      return { ok: false, error: `Fal API ${res.status}: ${errText}` }
    }

    const data = (await res.json()) as { video?: { url?: string }; request_id?: string }
    const url = data?.video?.url
    if (!url) return { ok: false, error: 'Video URL dönmedi.' }
    return { ok: true, video_url: url, request_id: data.request_id }
  } catch (e) {
    return {
      ok: false,
      error: `Fal istek hatası: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}
