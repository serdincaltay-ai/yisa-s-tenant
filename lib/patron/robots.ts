/**
 * YİSA-S Mimari v2.1 — 5 Robot
 * PATRON → CEO | Güvenlik | Veri | CELF | YİSA-S
 */

export const ROBOTS = [
  {
    id: 'ceo',
    name: 'CEO Robotu',
    icon: '🤖',
    role: 'Onay Havuzu & Deploy',
    color: '#f97316',
    gradient: 'from-orange-500/20 to-orange-600/10',
    border: 'border-orange-500/30',
    statusEndpoint: null,
  },
  {
    id: 'guvenlik',
    name: 'Güvenlik Robotu',
    icon: '🛡️',
    role: '7/24 İzleme & Koruma',
    color: '#ef4444',
    gradient: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/30',
    statusEndpoint: '/api/system/health',
  },
  {
    id: 'veri',
    name: 'Veri Robotu',
    icon: '💾',
    role: 'Veritabanı & Arşiv',
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    statusEndpoint: '/api/system/health',
  },
  {
    id: 'celf',
    name: 'YİSA-S CELF',
    icon: '⚡',
    role: '12 Direktörlük & Üretim',
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    statusEndpoint: '/api/system/health',
    subInfo: '12 direktörlük aktif',
  },
  {
    id: 'yisas',
    name: 'YİSA-S',
    icon: '🏪',
    role: 'Mağaza & Franchise',
    color: '#a855f7',
    gradient: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    statusEndpoint: null,
  },
] as const
