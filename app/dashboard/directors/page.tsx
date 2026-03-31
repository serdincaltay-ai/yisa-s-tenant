'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, RefreshCw, Loader2, Bot, Clock, FileCheck, Activity } from 'lucide-react'
import { CELF_DIRECTORATES, CELF_DIRECTORATE_KEYS, type DirectorKey } from '@/lib/robots/celf-center'
import { supabase } from '@/lib/supabase'

type DirectorActivity = {
  director_key: string
  director_name: string
  gelen: number
  giden: number
  durum: 'idle' | 'active'
  son_isler: { id: string; title: string; displayText?: string; status: string; created_at: string }[]
}

type StartupTask = { id: string; directorKey: string; name: string; command: string; requiresApproval?: boolean; status?: string }
type StartupSummary = Record<string, { pending: number; completed: number; total: number }>
type PendingApproval = { id: string; title: string; director_key?: string; status: string }

export default function DirectorsPage() {
  const [activity, setActivity] = useState<DirectorActivity[]>([])
  const [summary, setSummary] = useState<StartupSummary | null>(null)
  const [tasks, setTasks] = useState<StartupTask[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [actRes, startupRes, approvalsRes] = await Promise.all([
        fetch('/api/directors/activity'),
        fetch('/api/startup'),
        fetch('/api/approvals'),
      ])
      const actData = await actRes.json().catch(() => ({}))
      const startupData = await startupRes.json().catch(() => ({}))
      const approvalsData = await approvalsRes.json().catch(() => ({}))

      setActivity(Array.isArray(actData?.directors) ? actData.directors : [])
      const rawSummary = startupData?.summary
      setSummary(
        Array.isArray(rawSummary)
          ? Object.fromEntries(
              rawSummary.map((s: { director: string; pending: number; completed: number; total: number }) => [
                s.director,
                { pending: s.pending, completed: s.completed, total: s.total },
              ])
            )
          : rawSummary ?? null
      )
      setTasks(Array.isArray(startupData?.next_tasks) ? startupData.next_tasks : [])
      const items = Array.isArray(approvalsData?.items) ? approvalsData.items : []
      setPendingApprovals(
        items.filter((i: { status: string; director_key?: string }) => i.status === 'pending' && i.director_key) as PendingApproval[]
      )
    } catch {
      setError('Veri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleRunDirector = async (director: DirectorKey) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setActing(director)
    setError(null)
    try {
      const res = await fetch('/api/startup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_director', director, user_id: user.id, user }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d?.error ?? 'Tetikleme başarısız')
        return
      }
      await fetchAll()
    } catch {
      setError('İstek gönderilemedi')
    } finally {
      setActing(null)
    }
  }

  const handleRunTask = async (taskId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setActing(taskId)
    setError(null)
    try {
      const res = await fetch('/api/startup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_task', task_id: taskId, user_id: user.id, user }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d?.error ?? 'Tetikleme başarısız')
        return
      }
      await fetchAll()
    } catch {
      setError('İstek gönderilemedi')
    } finally {
      setActing(null)
    }
  }

  const formatTime = (s: string) => {
    if (!s) return '—'
    try {
      const d = new Date(s)
      const now = new Date()
      const diff = now.getTime() - d.getTime()
      if (diff < 60000) return 'Az önce'
      if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} sa önce`
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    } catch {
      return '—'
    }
  }

  if (loading && activity.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh] text-slate-500">
        <Loader2 size={32} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity size={28} className="text-cyan-400" />
            Direktörler
          </h1>
          <p className="text-slate-400 mt-1">
            Ne üretiyor, ne çıkartıyor, ne çalışıyor — takip edin
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingApprovals.length > 0 && (
            <Link
              href="/dashboard/onay-kuyrugu"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 text-sm font-medium"
            >
              <FileCheck size={16} />
              {pendingApprovals.length} onay bekliyor
            </Link>
          )}
          <button
            type="button"
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Yenile
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {(activity.length > 0 ? activity : CELF_DIRECTORATE_KEYS.map((key) => {
          const d = CELF_DIRECTORATES[key]
          return {
            director_key: key,
            director_name: d?.name ?? key,
            gelen: 0,
            giden: 0,
            durum: 'idle' as const,
            son_isler: [],
          }
        })).map((dir) => {
          const celfDir = CELF_DIRECTORATES[dir.director_key as DirectorKey]
          const s = summary?.[dir.director_key]
          const dirTasks = tasks.filter((t) => t.directorKey === dir.director_key)
          const dirPending = pendingApprovals.filter((a) => a.director_key === dir.director_key)
          const isActive = dir.durum === 'active' || dir.son_isler.length > 0 || dirPending.length > 0

          return (
            <div
              key={dir.director_key}
              className={`rounded-2xl border p-6 transition-colors ${
                isActive ? 'bg-cyan-500/5 border-cyan-500/30' : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-cyan-500/20' : 'bg-slate-700/50'
                  }`}>
                    <Bot className={isActive ? 'text-cyan-400' : 'text-slate-500'} size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{dir.director_name}</h2>
                    <p className="text-slate-500 text-sm">{dir.director_key}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunDirector(dir.director_key as DirectorKey)}
                  disabled={!!acting}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {acting === dir.director_key ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  Tetikle
                </button>
              </div>

              <p className="text-slate-400 text-sm mb-4">{celfDir?.work ?? '—'}</p>

              <div className="flex gap-4 text-xs mb-4">
                <span className="text-slate-500">Bugün gelen: <span className="text-white">{dir.gelen}</span></span>
                <span className="text-slate-500">Tamamlanan: <span className="text-emerald-400">{dir.giden}</span></span>
                {dirPending.length > 0 && (
                  <Link href="/dashboard/onay-kuyrugu" className="text-amber-400 hover:text-amber-300">
                    {dirPending.length} onay bekliyor
                  </Link>
                )}
              </div>

              {dir.son_isler.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-slate-700">
                  <p className="text-slate-500 text-xs font-medium">Son işler</p>
                  {dir.son_isler.map((i) => (
                    <div key={i.id} className="rounded-lg bg-slate-900/50 p-3 border border-slate-700/50">
                      <p className="text-slate-300 text-sm truncate">{i.title}</p>
                      {i.displayText && (
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{i.displayText}</p>
                      )}
                      <p className="text-slate-600 text-[10px] mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        {formatTime(i.created_at)}
                        <span className={`ml-2 px-1.5 py-0.5 rounded ${
                          i.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          i.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {i.status}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {dirTasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                  {dirTasks.slice(0, 2).map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 truncate flex-1">{t.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRunTask(t.id)}
                        disabled={!!acting}
                        className="flex-shrink-0 ml-2 px-2 py-1 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-xs disabled:opacity-50"
                      >
                        {acting === t.id ? <Loader2 size={12} className="animate-spin" /> : 'Çalıştır'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {tasks.length > 0 && (
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sıradaki Başlangıç Görevleri</h3>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4 border border-slate-700"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{t.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{t.directorKey}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunTask(t.id)}
                  disabled={!!acting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium disabled:opacity-50 ml-4"
                >
                  {acting === t.id ? <Loader2 size={16} className="animate-spin" /> : <><Play size={16} /> Tetikle</>}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
