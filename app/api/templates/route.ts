import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth, requirePatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

const KATEGORILER = ['CFO', 'CLO', 'CHRO', 'CMO', 'CTO', 'CSO', 'CSPO', 'COO', 'CMDO', 'CCO', 'CDO', 'CISO', 'RND'] as const

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export interface TemplateItem {
  id: string
  template_id?: string
  name: string
  type: string
  used_count?: number
  where_used?: string
  created_at: string
  source?: 'ceo' | 'db'
  director_key?: string
  is_approved?: boolean
}

export interface SablonItem {
  id: string
  ad: string
  kategori: string
  icerik: Record<string, unknown>
  durum: string
  olusturan: string
  created_at?: string
}

export interface RDSuggestion {
  id: string
  title: string
  description?: string
  source: string
  status: string
  created_at: string
}

/** SQL veya geçersiz string mi? — şablon içeriği değilse boş döner */
function isInvalidTemplateContent(s: string): boolean {
  const upper = s.trim().toUpperCase()
  return upper.startsWith('SELECT ') || upper.startsWith('INSERT ') || upper.startsWith('CREATE ') ||
    upper.startsWith('UPDATE ') || upper.startsWith('DELETE ') || upper.startsWith('DROP ') ||
    upper.includes('FROM ') || upper.includes('INTO ') || (upper.length > 500 && !s.includes('"'))
}

function mapCeoRowToSablon(row: Record<string, unknown>): SablonItem {
  const ad = (row.ad ?? row.template_name ?? '—') as string
  const kategori = (row.kategori ?? row.template_type ?? row.director_key ?? '—') as string
  const rawIcerik = row.icerik ?? row.content
  let icerik: Record<string, unknown> = {}
  if (rawIcerik != null && typeof rawIcerik === 'object' && !Array.isArray(rawIcerik)) {
    icerik = rawIcerik as Record<string, unknown>
  } else if (typeof rawIcerik === 'string') {
    if (isInvalidTemplateContent(rawIcerik)) {
      icerik = { aciklama: 'İçerik SQL veya geçersiz format — SABLONLAR_TEK_SQL.sql çalıştırın.' }
    } else {
      try {
        icerik = JSON.parse(rawIcerik) as Record<string, unknown>
      } catch {
        icerik = rawIcerik.length < 500 ? { aciklama: rawIcerik } : { aciklama: 'İçerik okunamadı.' }
      }
    }
  }
  return {
    id: String(row.id ?? ''),
    ad,
    kategori,
    icerik,
    durum: (row.durum as string) ?? 'aktif',
    olusturan: (row.olusturan ?? row.director_key ?? '') as string,
    created_at: row.created_at != null ? String(row.created_at) : undefined,
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = getSupabase()
    const kategoriParam = req.nextUrl?.searchParams?.get('kategori') ?? undefined

    let sablonlar: SablonItem[] = []
    let templates: TemplateItem[] = []
    let suggestions: RDSuggestion[] = []
    let ceoRows: Record<string, unknown>[] = []
    let cooTemplates: TemplateItem[] = []

    if (supabase) {
      // ceo_templates: 66 şablon (ad, kategori, icerik) — öncelikli
      try {
        const { data: ceoData } = await supabase
          .from('ceo_templates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200)
        if (Array.isArray(ceoData) && ceoData.length > 0) {
          let rows = ceoData as Record<string, unknown>[]
          if (kategoriParam && KATEGORILER.includes(kategoriParam as (typeof KATEGORILER)[number])) {
            rows = rows.filter(
              (r) =>
                (r.kategori as string) === kategoriParam ||
                (r.olusturan as string) === kategoriParam ||
                (r.director_key as string) === kategoriParam
            )
          }
          ceoRows = rows
          sablonlar = rows.map((row) => mapCeoRowToSablon(row))
        }
      } catch (_) {
        // ceo_templates yoksa devam
      }

      const templateTables = ['templates', 'sablonlar', 'template_pool', 'design_templates']
      for (const table of templateTables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        if (error) continue
        if (Array.isArray(data) && data.length > 0) {
          templates = data.map((row: Record<string, unknown>) => ({
            id: String(row.id ?? row.uuid ?? ''),
            template_id: String(row.id ?? row.uuid ?? ''),
            name: String(row.name ?? row.title ?? row.ad ?? row.slug ?? '—'),
            type: String(row.type ?? row.category ?? row.kategori ?? 'şablon'),
            used_count: typeof row.used_count === 'number' ? row.used_count : typeof row.kullanim_sayisi === 'number' ? row.kullanim_sayisi : undefined,
            where_used: row.where_used != null ? String(row.where_used) : undefined,
            created_at: String(row.created_at ?? row.olusturma_tarihi ?? ''),
            source: 'db' as const,
          }))
          break
        }
      }

      if (sablonlar.length === 0 && templates.length > 0) {
        sablonlar = templates.map((t) => ({
          id: t.id,
          ad: t.name,
          kategori: t.type,
          icerik: {},
          durum: 'aktif',
          olusturan: t.director_key ?? t.type,
          created_at: t.created_at,
        }))
      }

      // v0_template_library: ceo_templates boşsa veya az şablon varsa V0 ücretsiz şablonları ekle (robot bağlantısı gerekmez)
      if (sablonlar.length < 20) {
        try {
          const { data: v0Data } = await supabase
            .from('v0_template_library')
            .select('id, slug, ad, aciklama, kategori, director_key, source_path, is_free, quality_tier, icerik_ozeti, durum, created_at')
            .eq('durum', 'aktif')
            .order('created_at', { ascending: false })
            .limit(50)
          if (Array.isArray(v0Data) && v0Data.length > 0) {
            const v0Sablonlar = v0Data.map((row: Record<string, unknown>) => ({
              id: 'v0_' + String(row.slug ?? row.id),
              ad: String(row.ad ?? row.slug ?? '—'),
              kategori: String(row.kategori ?? row.director_key ?? 'V0'),
              icerik: (row.icerik_ozeti as Record<string, unknown>) ?? {},
              durum: String(row.durum ?? 'aktif'),
              olusturan: String(row.director_key ?? 'V0'),
              created_at: row.created_at != null ? String(row.created_at) : undefined,
            }))
            sablonlar = [...sablonlar, ...v0Sablonlar]
            for (const v of v0Sablonlar) {
              if (!cooTemplates.some((c) => c.id === v.id)) {
                cooTemplates.push({
                  id: v.id,
                  template_id: v.id,
                  name: v.ad,
                  type: v.kategori,
                  source: 'ceo',
                  created_at: v.created_at ?? '',
                })
              }
            }
          }
        } catch (_) {
          // v0_template_library yoksa veya migration çalışmadıysa sessiz geç
        }
      }

      // COO Mağazası: ceo_templates (onaylı/durum=aktif) + templates birleşik liste
      cooTemplates = []
      for (const s of sablonlar) {
        const row = ceoRows.find((r: Record<string, unknown>) => String(r.id) === s.id)
        const isApproved = row ? (row.is_approved === true) : false
        const durumAktif = (s.durum ?? 'aktif') === 'aktif'
        if (ceoRows.length > 0 ? (isApproved || durumAktif) : true) {
          cooTemplates.push({
            id: s.id,
            template_id: s.id,
            name: s.ad,
            type: s.kategori,
            source: ceoRows.length > 0 ? 'ceo' : 'db',
            created_at: s.created_at ?? '',
          })
        }
      }
      for (const t of templates) {
        if (!cooTemplates.some((c) => c.id === t.id)) {
          cooTemplates.push({ ...t, source: (t.source ?? 'db') as 'ceo' | 'db' })
        }
      }

      const suggestionTables = ['rd_suggestions', 'ceo_updates', 'ar_ge', 'suggestions']
      for (const table of suggestionTables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        if (error) continue
        if (Array.isArray(data) && data.length > 0) {
          suggestions = data.map((row: Record<string, unknown>) => ({
            id: String(row.id ?? row.uuid ?? ''),
            title: String(row.title ?? row.name ?? '—'),
            description: row.description != null ? String(row.description) : undefined,
            source: String(row.source ?? 'CEO'),
            status: String(row.status ?? 'pending'),
            created_at: String(row.created_at ?? ''),
          }))
          break
        }
      }
    }

    return NextResponse.json({
      sablonlar,
      toplam: sablonlar.length,
      templates,
      coo_templates: cooTemplates,
      suggestions,
    })
  } catch {
    return NextResponse.json({
      sablonlar: [],
      toplam: 0,
      templates: [],
      coo_templates: [],
      suggestions: [],
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePatron()
    if (auth instanceof NextResponse) return auth

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase bağlantısı yok' }, { status: 503 })
    }
    const body = await req.json()
    const ad = typeof body.ad === 'string' ? body.ad.trim() : ''
    const kategori = typeof body.kategori === 'string' ? body.kategori.trim() : ''
    const olusturan = typeof body.olusturan === 'string' ? body.olusturan.trim() : 'PATRON'
    if (!ad || !kategori) {
      return NextResponse.json({ error: 'ad ve kategori zorunludur' }, { status: 400 })
    }
    const icerik =
      body.icerik != null && typeof body.icerik === 'object'
        ? body.icerik
        : typeof body.icerik === 'string'
          ? (() => {
              try {
                return JSON.parse(body.icerik) as Record<string, unknown>
              } catch {
                return { aciklama: body.icerik }
              }
            })()
          : {}
    const durum = typeof body.durum === 'string' ? body.durum : 'aktif'

    const { data, error } = await supabase
      .from('ceo_templates')
      .insert({
        ad,
        kategori,
        icerik,
        durum,
        olusturan,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ id: data?.id, message: 'Şablon eklendi' })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}
