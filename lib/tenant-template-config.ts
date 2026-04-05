/**
 * Tenant Şablon Konfigürasyonu
 * Her tenant subdomain'i için hangi şablonun kullanılacağını belirler.
 * Şablon tipleri: 'standard' | 'medium' | 'premium'
 */

export type TemplateType = 'standard' | 'medium' | 'premium'

export interface TenantConfig {
  slug: string
  ad: string
  kisa: string
  slogan: string
  altSlogan: string
  aciklama: string
  telefon: string
  email: string
  instagram: string
  instagramUrl: string
  whatsapp: string
  adres: string
  adresKisa: string
  calisma: string
  harita: string
  haritaEmbed: string
  brans: string
  template: TemplateType
  /** Logo kısa metni (navbar/badge) */
  logoBadge: string
  /** Logo URL (DB'den gelen tam URL — varsa img olarak kullanılır) */
  logoUrl?: string | null
  /** Üst başlık (kurum adı) */
  ustBaslik: string
  /** Federasyon bilgileri (opsiyonel) */
  federationInfo?: {
    ilTemsilcisi?: string
    yarismaKulupleri?: string[]
  }
}

/** Branş renk haritası — schedule grid'de kullanılır */
export const BRANS_RENK: Record<string, { bg: string; text: string; border: string }> = {
  'Cimnastik': { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30' },
  'Artistik Cimnastik': { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30' },
  'Ritmik Cimnastik': { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
  'Yüzme': { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  'Basketbol': { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  'Voleybol': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  'Futbol': { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  'Tenis': { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  'Jimnastik': { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
  'Atletizm': { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' },
  'Dans': { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300', border: 'border-fuchsia-500/30' },
}

/** Varsayılan branş rengi */
export const DEFAULT_BRANS_RENK = { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' }

/** FullCalendar event backgroundColor — branş bazlı hex (BRANS_RENK ile uyumlu koyu tonlar) */
export const BRANS_CALENDAR_HEX: Record<string, string> = {
  'Cimnastik': '#be185d',
  'Artistik Cimnastik': '#be185d',
  'Ritmik Cimnastik': '#b91c1c',
  'Yüzme': '#0e7490',
  'Basketbol': '#b45309',
  'Voleybol': '#047857',
  'Futbol': '#7e22ce',
  'Tenis': '#0891b2',
  'Jimnastik': '#b91c1c',
  'Atletizm': '#c2410c',
  'Dans': '#a21caf',
}

/** Haftalık ders programı verisi */
export interface DersProgramiItem {
  gun: string
  saat: string
  brans: string
  seviye: string
}

/** Paket verisi */
export interface PaketItem {
  baslik: string
  seans: number
  fiyat: string
  birimFiyat: string
  aciklama: string
  taksit: string
  maxTaksit: number
  ozellikler: string[]
  one_cikan: boolean
}

/** Standart paketler — tüm şablonlarda aynı */
export const STANDART_PAKETLER: PaketItem[] = [
  {
    baslik: 'Başlangıç Paketi',
    seans: 24,
    fiyat: '30.000',
    birimFiyat: '1.250',
    aciklama: 'Haftada 2 ders · ~3 ay',
    taksit: 'Tek seferde ödeme',
    maxTaksit: 1,
    ozellikler: [
      '24 ders hakkı',
      'Profesyonel eğitim',
      'İlk ölçüm dahil',
      'Gelişim raporu',
      'Veli paneli erişimi',
      'WhatsApp destek hattı',
    ],
    one_cikan: false,
  },
  {
    baslik: 'Gelişim Paketi',
    seans: 48,
    fiyat: '52.800',
    birimFiyat: '1.100',
    aciklama: 'Haftada 2-3 ders · ~4-6 ay',
    taksit: '2 taksit seçeneği',
    maxTaksit: 2,
    ozellikler: [
      '48 ders hakkı',
      'Profesyonel eğitim',
      '3 ölçüm dahil',
      'Detaylı gelişim raporu',
      'Kardeş kullanabilir',
      'Veli paneli erişimi',
      'Müsabaka hazırlık desteği',
      'WhatsApp öncelikli destek',
    ],
    one_cikan: true,
  },
  {
    baslik: 'Şampiyon Paketi',
    seans: 60,
    fiyat: '60.000',
    birimFiyat: '1.000',
    aciklama: 'Haftada 3+ ders · ~5 ay',
    taksit: '2 taksit seçeneği',
    maxTaksit: 2,
    ozellikler: [
      '60 ders hakkı',
      'Profesyonel eğitim',
      'Sınırsız ölçüm',
      'Kişisel antrenman planı',
      'Kardeş kullanabilir',
      'Veli paneli erişimi',
      'Müsabaka tam destek',
      'Özel antrenör görüşmesi',
      'WhatsApp VIP destek',
    ],
    one_cikan: false,
  },
]

/** BJK Tuzla Cimnastik ders programı (haftalık grid için) */
const BJK_DERS_PROGRAMI: DersProgramiItem[] = [
  { gun: 'Pazartesi', saat: '15:00', brans: 'Artistik Cimnastik', seviye: 'Mini (5-7)' },
  { gun: 'Pazartesi', saat: '17:00', brans: 'Artistik Cimnastik', seviye: 'Midi (8-12)' },
  { gun: 'Salı', saat: '15:00', brans: 'Artistik Cimnastik', seviye: 'Başlangıç' },
  { gun: 'Salı', saat: '17:00', brans: 'Artistik Cimnastik', seviye: 'İleri' },
  { gun: 'Çarşamba', saat: '15:00', brans: 'Artistik Cimnastik', seviye: 'Mini (5-7)' },
  { gun: 'Çarşamba', saat: '17:00', brans: 'Artistik Cimnastik', seviye: 'Midi (8-12)' },
  { gun: 'Perşembe', saat: '15:00', brans: 'Artistik Cimnastik', seviye: 'Başlangıç' },
  { gun: 'Perşembe', saat: '17:00', brans: 'Artistik Cimnastik', seviye: 'İleri' },
  { gun: 'Cuma', saat: '15:00', brans: 'Artistik Cimnastik', seviye: 'Mini (5-7)' },
  { gun: 'Cumartesi', saat: '10:00', brans: 'Artistik Cimnastik', seviye: 'Tüm Gruplar' },
  { gun: 'Cumartesi', saat: '13:00', brans: 'Artistik Cimnastik', seviye: 'Müsabaka' },
]

/** Fener Ataşehir ders programı */
const FENER_DERS_PROGRAMI: DersProgramiItem[] = [
  { gun: 'Pazartesi', saat: '14:00', brans: 'Cimnastik', seviye: 'Mini (4-6)' },
  { gun: 'Pazartesi', saat: '16:00', brans: 'Cimnastik', seviye: 'Midi (7-10)' },
  { gun: 'Pazartesi', saat: '18:00', brans: 'Basketbol', seviye: 'U12' },
  { gun: 'Salı', saat: '15:00', brans: 'Yüzme', seviye: 'Başlangıç' },
  { gun: 'Salı', saat: '17:00', brans: 'Voleybol', seviye: 'U14' },
  { gun: 'Çarşamba', saat: '14:00', brans: 'Cimnastik', seviye: 'Mini (4-6)' },
  { gun: 'Çarşamba', saat: '16:00', brans: 'Cimnastik', seviye: 'Midi (7-10)' },
  { gun: 'Perşembe', saat: '15:00', brans: 'Futbol', seviye: 'U10' },
  { gun: 'Perşembe', saat: '17:00', brans: 'Tenis', seviye: 'Başlangıç' },
  { gun: 'Cuma', saat: '14:00', brans: 'Cimnastik', seviye: 'İleri' },
  { gun: 'Cuma', saat: '16:00', brans: 'Atletizm', seviye: 'Tüm Yaşlar' },
  { gun: 'Cumartesi', saat: '10:00', brans: 'Cimnastik', seviye: 'Tüm Gruplar' },
  { gun: 'Cumartesi', saat: '13:00', brans: 'Basketbol', seviye: 'U14' },
]

/** Kartal Cimnastik ders programı */
const KARTAL_DERS_PROGRAMI: DersProgramiItem[] = [
  { gun: 'Pazartesi', saat: '15:00', brans: 'Artistik Cimnastik', seviye: 'Mini (5-7)' },
  { gun: 'Pazartesi', saat: '17:00', brans: 'Ritmik Cimnastik', seviye: 'Başlangıç' },
  { gun: 'Salı', saat: '15:00', brans: 'Artistik Cimnastik', seviye: 'Midi (8-12)' },
  { gun: 'Salı', saat: '17:00', brans: 'Ritmik Cimnastik', seviye: 'İleri' },
  { gun: 'Çarşamba', saat: '15:00', brans: 'Artistik Cimnastik', seviye: 'Mini (5-7)' },
  { gun: 'Çarşamba', saat: '17:00', brans: 'Artistik Cimnastik', seviye: 'İleri' },
  { gun: 'Perşembe', saat: '15:00', brans: 'Ritmik Cimnastik', seviye: 'Mini (5-7)' },
  { gun: 'Perşembe', saat: '17:00', brans: 'Artistik Cimnastik', seviye: 'Midi (8-12)' },
  { gun: 'Cuma', saat: '15:00', brans: 'Ritmik Cimnastik', seviye: 'Midi (8-12)' },
  { gun: 'Cumartesi', saat: '10:00', brans: 'Artistik Cimnastik', seviye: 'Tüm Gruplar' },
  { gun: 'Cumartesi', saat: '13:00', brans: 'Ritmik Cimnastik', seviye: 'Tüm Gruplar' },
]

/** Demo Tesis ders programı (medium şablon) */
const DEMO_DERS_PROGRAMI: DersProgramiItem[] = [
  { gun: 'Pazartesi', saat: '14:00', brans: 'Cimnastik', seviye: 'Mini (4-6)' },
  { gun: 'Pazartesi', saat: '16:00', brans: 'Cimnastik', seviye: 'Midi (7-10)' },
  { gun: 'Salı', saat: '15:00', brans: 'Yüzme', seviye: 'Başlangıç' },
  { gun: 'Salı', saat: '17:00', brans: 'Cimnastik', seviye: 'İleri' },
  { gun: 'Çarşamba', saat: '14:00', brans: 'Cimnastik', seviye: 'Mini (4-6)' },
  { gun: 'Çarşamba', saat: '16:00', brans: 'Yüzme', seviye: 'Orta' },
  { gun: 'Perşembe', saat: '15:00', brans: 'Cimnastik', seviye: 'Midi (7-10)' },
  { gun: 'Perşembe', saat: '17:00', brans: 'Dans', seviye: 'Tüm Yaşlar' },
  { gun: 'Cuma', saat: '14:00', brans: 'Cimnastik', seviye: 'Başlangıç' },
  { gun: 'Cuma', saat: '16:00', brans: 'Yüzme', seviye: 'İleri' },
  { gun: 'Cumartesi', saat: '10:00', brans: 'Cimnastik', seviye: 'Tüm Gruplar' },
  { gun: 'Cumartesi', saat: '13:00', brans: 'Dans', seviye: 'Başlangıç' },
]

/** Fener Ataşehir ortak config — fenerbahceatasehir ve feneratasehir slug'larında kullanılır */
const FENER_ATASEHIR_BASE: TenantConfig = {
  slug: 'fenerbahceatasehir',
  ad: 'Fenerbahçe Ataşehir Spor Okulu',
  kisa: 'Fener Ataşehir',
  slogan: 'Sporda Geleceğin Yıldızlarını Yetiştiriyoruz',
  altSlogan: 'Çok branşlı profesyonel spor eğitimi',
  aciklama:
    'Fenerbahçe Spor Kulübü bünyesinde, cimnastik, yüzme, basketbol ve daha fazlası. Profesyonel antrenör kadrosu ile 4-16 yaş arası çocuklarınıza modern tesislerde eğitim.',
  telefon: '0532 000 00 00',
  email: 'info@feneratasehir.com',
  instagram: '@feneratasehir',
  instagramUrl: 'https://instagram.com/feneratasehir',
  whatsapp: '905320000000',
  adres: 'Ataşehir, İstanbul',
  adresKisa: 'Ataşehir/İstanbul',
  calisma: 'Hafta içi 09:00-21:00 · Cumartesi 09:00-18:00',
  harita: 'https://maps.google.com/?q=Atasehir+Istanbul',
  haritaEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12065.8!2d29.1!3d40.98!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zQXRhxZ9laGly!5e0!3m2!1str!2str',
  brans: 'Çok Branşlı',
  template: 'premium',
  logoBadge: 'FB',
  ustBaslik: 'Fenerbahçe Spor Kulübü',
}

/** Tenant konfigürasyonları */
export const TENANT_CONFIGS: Record<string, TenantConfig> = {
  bjktuzlacimnastik: {
    slug: 'bjktuzlacimnastik',
    ad: 'Tuzla Beşiktaş Cimnastik Okulu',
    kisa: 'BJK Tuzla Cimnastik',
    slogan: 'Çocuğunuzun Potansiyelini Keşfedin',
    altSlogan: 'Artistik cimnastikte profesyonel eğitim',
    aciklama:
      'Beşiktaş JK Spor Okulları bünyesinde, profesyonel antrenörler eşliğinde artistik cimnastik eğitimleri sunuyoruz. 4-14 yaş arası çocuklarınız için güvenli, eğlenceli ve gelişim odaklı ortam.',
    telefon: '0530 710 46 24',
    email: 'info@hobigym.com',
    instagram: '@bjktuzlacimnastik',
    instagramUrl: 'https://instagram.com/bjktuzlacimnastik',
    whatsapp: '905307104624',
    adres: 'Evliya Çelebi Mah. Hatboyu Cad. No:1, Tuzla Port AVM, 34940 Tuzla/İstanbul',
    adresKisa: 'Tuzla Port AVM, Tuzla/İstanbul',
    calisma: 'Hafta içi 10:00-20:00 · Cumartesi 09:00-17:00',
    harita: 'https://maps.google.com/?q=Tuzla+Port+AVM+Istanbul',
    haritaEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3016.5!2d29.2913!3d40.8165!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cac5e3a9d7c0a7%3A0x90a3e2d0c1f5b8a2!2sTuzla%20Port%20AVM!5e0!3m2!1str!2str!4v1709500000000',
    brans: 'Artistik Cimnastik',
    template: 'premium',
    logoBadge: 'BJK',
    ustBaslik: 'Beşiktaş JK Spor Okulları',
    federationInfo: {
      ilTemsilcisi: 'İstanbul İl Cimnastik Temsilcisi',
      yarismaKulupleri: ['BJK Tuzla', 'Fenerbahçe SK', 'Galatasaray SK', 'Beşiktaş JK'],
    },
  },
  fenerbahceatasehir: FENER_ATASEHIR_BASE,
  feneratasehir: {
    ...FENER_ATASEHIR_BASE,
    slug: 'feneratasehir',
    telefon: 'İletişim için lütfen arayın',
    whatsapp: '',
  } as TenantConfig,
  kartalcimnastik: {
    slug: 'kartalcimnastik',
    ad: 'Kartal Cimnastik Spor Kulübü',
    kisa: 'Kartal Cimnastik',
    slogan: 'Cimnastikte Güç ve Zarafet',
    altSlogan: 'Profesyonel cimnastik eğitimi',
    aciklama:
      'Kartal Cimnastik Spor Kulübü, İstanbul Kartal bölgesinde artistik ve ritmik cimnastik dallarında profesyonel eğitim vermektedir. Deneyimli antrenör kadromuz ile 4-16 yaş arası çocuklarınızın sportif gelişimini destekliyoruz.',
    telefon: '0530 000 00 00',
    email: 'info@kartalcimnastik.com',
    instagram: '@kartalcimnastik',
    instagramUrl: 'https://instagram.com/kartalcimnastik',
    whatsapp: '905300000000',
    adres: 'Kartal, İstanbul',
    adresKisa: 'Kartal/İstanbul',
    calisma: 'Hafta içi 10:00-20:00 · Cumartesi 09:00-17:00',
    harita: 'https://maps.google.com/?q=Kartal+Istanbul',
    haritaEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12070.0!2d29.19!3d40.89!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zS2FydGFs!5e0!3m2!1str!2str',
    brans: 'Cimnastik',
    template: 'standard',
    logoBadge: 'KC',
    ustBaslik: 'Kartal Cimnastik Spor Kulübü',
  },
  demotesis: {
    slug: 'demotesis',
    ad: 'Demo Spor Tesisi',
    kisa: 'Demo Tesis',
    slogan: 'Sporda Mükemmelliği Keşfedin',
    altSlogan: 'Cimnastik, yüzme ve dans eğitimi',
    aciklama:
      'Demo Spor Tesisi, orta şablon ile oluşturulmuş örnek bir tesis sayfasıdır. ' +
      'Cimnastik, yüzme ve dans branşlarında profesyonel eğitim sunuyoruz. ' +
      '4-14 yaş arası çocuklarınız için güvenli ve gelişim odaklı bir ortam.',
    telefon: '0555 123 45 67',
    email: 'info@demotesis.yisa-s.com',
    instagram: '@demotesis',
    instagramUrl: 'https://instagram.com/demotesis',
    whatsapp: '905551234567',
    adres: 'Örnek Mah. Spor Cad. No:10, 34000 Kadıköy/İstanbul',
    adresKisa: 'Kadıköy/İstanbul',
    calisma: 'Hafta içi 09:00-20:00 · Cumartesi 09:00-16:00',
    harita: 'https://maps.google.com/?q=Kadikoy+Istanbul',
    haritaEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12065.8!2d29.02!3d40.99!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zS2FkxLFrw7Z5!5e0!3m2!1str!2str',
    brans: 'Çok Branşlı',
    template: 'medium',
    logoBadge: 'DM',
    ustBaslik: 'Demo Spor Tesisi',
  },
}

/** Tenant slug'dan ders programını getir */
export function getDersProgrami(slug: string): DersProgramiItem[] {
  switch (slug) {
    case 'bjktuzlacimnastik':
      return BJK_DERS_PROGRAMI
    case 'feneratasehir':
    case 'fenerbahceatasehir':
      return FENER_DERS_PROGRAMI
    case 'kartalcimnastik':
      return KARTAL_DERS_PROGRAMI
    case 'demotesis':
      return DEMO_DERS_PROGRAMI
    default:
      return BJK_DERS_PROGRAMI
  }
}

/** Tenant slug'dan config getir */
export function getTenantConfig(slug: string): TenantConfig | null {
  return TENANT_CONFIGS[slug] ?? null
}

/** Varsayılan tenant config (fallback) */
export function getDefaultTenantConfig(): TenantConfig {
  return TENANT_CONFIGS['bjktuzlacimnastik']
}
