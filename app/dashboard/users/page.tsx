'use client'

import { ROLE_LEVELS, ROLE_DESCRIPTIONS, DASHBOARD_ALLOWED_ROLES } from '@/lib/auth/roles'

export default function UsersPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Kullanıcı Yönetimi</h1>
        <p className="text-slate-400">13 seviye rol — Supabase ile senkron. Panel erişimi: {DASHBOARD_ALLOWED_ROLES.join(', ')}.</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">Hangi rol ne yapabilir?</h2>
        <p className="text-slate-500 text-sm mb-4">
          Roller yetki seviyesine göre sıralanır. Patron Paneli yalnızca Patron, Süper Admin ve Sistem Admini tarafından kullanılabilir.
        </p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Roller (1–13)</h2>
        <div className="space-y-2">
          {ROLE_LEVELS.map((role, i) => (
            <div
              key={role}
              className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700"
            >
              <span className="text-slate-500 w-8 shrink-0">{(i + 1).toString().padStart(2)}</span>
              <span className="text-slate-200 font-medium shrink-0">{role}</span>
              <span className="text-slate-500 text-sm">
                {ROLE_DESCRIPTIONS[role]}
              </span>
              {role === 'Patron' && (
                <span className="text-amber-400 text-sm shrink-0">— Serdinç Altay</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-sm mt-4">
          Kullanıcı listesi ve rol atamaları Supabase Auth + tablolardan çekilecek.
        </p>
      </div>
    </div>
  )
}
