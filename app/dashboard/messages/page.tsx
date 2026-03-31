'use client'

import { MessageSquare } from 'lucide-react'

export default function MessagesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Mesajlar</h1>
        <p className="text-slate-400">Tüm mesajlar burada listelenecek. Supabase veya entegrasyon sonrası bağlanacak.</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="text-slate-500" size={28} />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Mesajlar</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Bu sayfa ileride Supabase <code className="text-slate-400 bg-slate-900 px-1 rounded">messages</code> veya
          benzeri bir tablo ile doldurulacak. Gelen kutusu, gönderilenler ve destek talepleri burada gösterilecek.
        </p>
      </div>
    </div>
  )
}
