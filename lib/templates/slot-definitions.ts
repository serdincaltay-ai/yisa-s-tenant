/**
 * FAZ 8: Template + Slot Sistemi — Slot tanımları
 * 10 slot kodu + robot modları + zorunluluk bilgisi
 */

export interface SlotDefinition {
  slot_key: string
  slot_title: string
  robot_mode: string
  token_required: boolean
  is_required: boolean // Yayın için zorunlu mu?
  sira: number
}

/** 10 slot tanımı — tüm templateler için ortak */
export const SLOT_DEFINITIONS: SlotDefinition[] = [
  { slot_key: 'hero', slot_title: 'Ana Görsel / Karşılama', robot_mode: 'karsilama', token_required: false, is_required: true, sira: 1 },
  { slot_key: 'program', slot_title: 'Ders Programı', robot_mode: 'bilgi', token_required: false, is_required: true, sira: 2 },
  { slot_key: 'trainer', slot_title: 'Antrenörler', robot_mode: 'bilgi', token_required: false, is_required: false, sira: 3 },
  { slot_key: 'aidat', slot_title: 'Ücretler / Paketler', robot_mode: 'satis', token_required: false, is_required: false, sira: 4 },
  { slot_key: 'kayit', slot_title: 'Kayıt Formu', robot_mode: 'yonlendirme', token_required: false, is_required: true, sira: 5 },
  { slot_key: 'olcum', slot_title: 'Ölçüm / Gelişim', robot_mode: 'bilgi', token_required: false, is_required: false, sira: 6 },
  { slot_key: 'galeri', slot_title: 'Galeri', robot_mode: 'tanitim', token_required: false, is_required: false, sira: 7 },
  { slot_key: 'sosyal', slot_title: 'Sosyal Medya', robot_mode: 'uretici', token_required: true, is_required: false, sira: 8 },
  { slot_key: 'iletisim', slot_title: 'İletişim', robot_mode: 'yonlendirme', token_required: false, is_required: true, sira: 9 },
  { slot_key: 'cta', slot_title: 'Harekete Geçir (CTA)', robot_mode: 'satis', token_required: false, is_required: true, sira: 10 },
]

/** Zorunlu slotlar — yayın için bu slotların dolu olması gerekir */
export const REQUIRED_SLOT_KEYS = SLOT_DEFINITIONS.filter(s => s.is_required).map(s => s.slot_key)
// ['hero', 'program', 'kayit', 'iletisim', 'cta']

/** Template bazlı hangi slotlar aktif */
export const TEMPLATE_SLOT_CONFIG: Record<string, Record<string, boolean>> = {
  premium: {
    hero: true, program: true, trainer: true, aidat: true, kayit: true,
    olcum: true, galeri: true, sosyal: true, iletisim: true, cta: true,
  },
  standart: {
    hero: true, program: true, trainer: true, aidat: true, kayit: true,
    olcum: true, galeri: false, sosyal: false, iletisim: true, cta: true,
  },
  minimal: {
    hero: true, program: true, trainer: false, aidat: false, kayit: true,
    olcum: false, galeri: false, sosyal: false, iletisim: true, cta: true,
  },
}

/**
 * Template key ile sablon_tipi arasında eşleme
 * Onboarding'de kullanılan 'standard'/'medium'/'premium' → DB'deki template_key
 */
export function mapSablonToTemplateKey(sablon: string): string {
  switch (sablon) {
    case 'premium': return 'premium'
    case 'medium': return 'standart'
    case 'standard': return 'minimal'
    default: return 'standart'
  }
}
