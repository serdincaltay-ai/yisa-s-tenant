/**
 * YİSA-S Sistem Durumu API'si
 * Tüm bileşenlerin durumunu tek endpoint'ten kontrol et
 * Tarih: 31 Ocak 2026
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ROBOT_HIERARCHY } from '@/lib/robots/hierarchy'
import { CELF_DIRECTORATES, CELF_DIRECTORATE_KEYS } from '@/lib/robots/celf-center'
import { getDirectorateStartupSummary } from '@/lib/robots/directorate-initial-tasks'

export const dynamic = 'force-dynamic'

interface SystemStatus {
  timestamp: string
  overall: 'healthy' | 'degraded' | 'error'
  components: {
    name: string
    status: 'ok' | 'warning' | 'error'
    message?: string
  }[]
  robots: {
    layer: number
    name: string
    status: 'active' | 'inactive' | 'unknown'
  }[]
  directorates: {
    code: string
    name: string
    aiProviders: string[]
    initialTasksStatus: { pending: number; completed: number }
  }[]
  database: {
    connected: boolean
    tables?: number
    error?: string
  }
  aiServices: {
    name: string
    configured: boolean
  }[]
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET() {
  try {
    const status: SystemStatus = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      components: [],
      robots: [],
      directorates: [],
      database: { connected: false },
      aiServices: [],
    }

    // 1. Veritabanı kontrolü (robots yoksa celf_tasks, patron_commands dene)
    const supabase = getSupabase()
    if (supabase) {
      try {
        let dbCheck: { error: unknown; data: unknown } = await supabase.from('robots').select('kod').limit(1)
        if (dbCheck.error) {
          dbCheck = await supabase.from('celf_tasks').select('id').limit(1)
        }
        if (dbCheck.error) {
          dbCheck = await supabase.from('patron_commands').select('id').limit(1)
        }

        if (dbCheck.error) {
          status.database = { connected: true, error: 'robots/celf_tasks tablosu yok - Migration çalıştırın' }
          status.components.push({ name: 'Supabase', status: 'warning', message: 'Bağlantı OK, migration gerekli' })
          if (status.overall === 'healthy') status.overall = 'degraded'
        } else {
          status.database = { connected: true }
          status.components.push({ name: 'Supabase', status: 'ok', message: 'Bağlantı OK' })
        }
      } catch (e) {
        status.database = { connected: false, error: 'Bağlantı hatası' }
        status.components.push({ name: 'Supabase', status: 'error', message: 'Bağlantı hatası' })
        status.overall = 'error'
      }
    } else {
      status.database = { connected: false, error: 'Supabase yapılandırılmamış' }
      status.components.push({ name: 'Supabase', status: 'warning', message: 'Yapılandırılmamış' })
      status.overall = 'degraded'
    }

    // 2. Robot hiyerarşisi
    for (const robot of ROBOT_HIERARCHY) {
      status.robots.push({
        layer: robot.layer,
        name: robot.name,
        status: 'active', // Varsayılan olarak aktif
      })
    }
    status.components.push({
      name: 'Robot Hiyerarşisi',
      status: 'ok',
      message: `${ROBOT_HIERARCHY.length} robot tanımlı`,
    })

    // 3. Direktörlükler
    const startupSummary = getDirectorateStartupSummary()
    for (const key of CELF_DIRECTORATE_KEYS) {
      const dir = CELF_DIRECTORATES[key]
      const summary = startupSummary.find((s) => s.director === key)
      status.directorates.push({
        code: key,
        name: dir.name,
        aiProviders: dir.aiProviders,
        initialTasksStatus: {
          pending: summary?.pending ?? 0,
          completed: summary?.completed ?? 0,
        },
      })
    }
    status.components.push({
      name: 'CELF Direktörlükler',
      status: 'ok',
      message: `${CELF_DIRECTORATE_KEYS.length} direktörlük tanımlı`,
    })

    // 4. AI Servisleri
    const aiConfigs = [
      { name: 'OpenAI (GPT)', key: 'OPENAI_API_KEY' },
      { name: 'Anthropic (Claude)', key: 'ANTHROPIC_API_KEY' },
      { name: 'Google (Gemini)', key: 'GOOGLE_GEMINI_API_KEY' },
      { name: 'Together', key: 'TOGETHER_API_KEY' },
      { name: 'V0', key: 'V0_API_KEY' },
      { name: 'GitHub', key: 'GITHUB_TOKEN' },
    ]

    let configuredCount = 0
    for (const ai of aiConfigs) {
      const configured = !!process.env[ai.key]
      status.aiServices.push({ name: ai.name, configured })
      if (configured) configuredCount++
    }

    if (configuredCount === 0) {
      status.components.push({
        name: 'AI Servisleri',
        status: 'error',
        message: 'Hiçbir AI servisi yapılandırılmamış',
      })
      status.overall = 'error'
    } else if (configuredCount < 3) {
      status.components.push({
        name: 'AI Servisleri',
        status: 'warning',
        message: `${configuredCount}/${aiConfigs.length} servis yapılandırılmış`,
      })
      if (status.overall === 'healthy') status.overall = 'degraded'
    } else {
      status.components.push({
        name: 'AI Servisleri',
        status: 'ok',
        message: `${configuredCount}/${aiConfigs.length} servis yapılandırılmış`,
      })
    }

    // 5. Başlangıç görevleri durumu
    const totalPending = startupSummary.reduce((sum, s) => sum + s.pending, 0)
    const totalCompleted = startupSummary.reduce((sum, s) => sum + s.completed, 0)
    status.components.push({
      name: 'Başlangıç Görevleri',
      status: totalPending > 0 ? 'warning' : 'ok',
      message: `${totalCompleted} tamamlandı, ${totalPending} bekliyor`,
    })

    return NextResponse.json(status)
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        overall: 'error',
        error: err,
        components: [],
        robots: [],
        directorates: [],
        database: { connected: false, error: err },
        aiServices: [],
      },
      { status: 500 }
    )
  }
}
