/**
 * YİSA-S Robot Hiyerarşisi (KİLİTLİ)
 * Katman 0–7, talimatla sabit.
 */

export interface HierarchyNode {
  layer: number
  name: string
  detail?: string
}

/**
 * YİSA-S Robot Hiyerarşisi (Anayasa Uyumlu - 31 Ocak 2026)
 * Referans: yisa-s-komut-zinciri-protokol.md
 */
export const ROBOT_HIERARCHY: HierarchyNode[] = [
  { layer: 0, name: 'PATRON', detail: 'Serdinç Altay - Tek Yetkili' },
  { layer: 1, name: 'PATRON ASİSTAN', detail: 'Claude + GPT + Gemini + Together + V0 + Cursor - Özel işler, danışmanlık' },
  { layer: 2, name: 'CIO', detail: 'Strateji Beyin - Komut yorumlama, önceliklendirme' },
  { layer: 3, name: 'SİBER GÜVENLİK', detail: '3 Duvar sistemi, bypass önleme' },
  { layer: 4, name: 'VERİ ARŞİVLEME', detail: 'Yedekleme, şablon kütüphanesi' },
  { layer: 5, name: 'CEO ORGANİZATÖR', detail: 'Kural tabanlı, AI yok - Görev dağıtımı' },
  { layer: 6, name: 'YİSA-S CELF MERKEZ', detail: '13 Direktörlük (CSPO dahil)' },
  { layer: 7, name: 'COO YARDIMCI', detail: 'Operasyon koordinasyonu' },
  { layer: 8, name: 'YİSA-S VİTRİN', detail: 'Franchise hizmetleri' },
]
