'use client'

export default function FacilitiesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Tesis Yönetimi</h1>
        <p className="text-slate-400">Salonlar, merkezler, lokasyonlar — COO koordinasyonu.</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Tesisler</h2>
        <p className="text-slate-500">
          Tesis listesi Supabase <code className="text-slate-400 bg-slate-900 px-1 rounded">facilities</code> tablosundan
          çekilecek. CRUD işlemleri Patron onayı ile.
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">0</p>
            <p className="text-slate-400 text-sm">Aktif Tesis</p>
          </div>
          <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4 text-center">
            <p className="text-3xl font-bold text-slate-400">0</p>
            <p className="text-slate-400 text-sm">Franchise</p>
          </div>
          <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4 text-center">
            <p className="text-3xl font-bold text-slate-400">0</p>
            <p className="text-slate-400 text-sm">Toplam Kapasite</p>
          </div>
        </div>
      </div>
    </div>
  )
}
