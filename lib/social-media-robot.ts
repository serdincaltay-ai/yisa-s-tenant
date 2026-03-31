/**
 * Sosyal Medya Robotu — Instagram / WhatsApp / Facebook sablon uretici
 * Tenant-branded icerik olusturma
 */

export type Platform = "instagram" | "whatsapp" | "facebook"
export type TemplateType = "post" | "story" | "reel" | "message" | "cover"

export interface SocialMediaTemplate {
  id: string
  platform: Platform
  template_type: TemplateType
  title: string
  content: string
  variables: string[]
  media_url: string | null
}

export interface TemplateVariables {
  tenant_name: string
  branch_name?: string
  phone?: string
  address?: string
  date?: string
  time?: string
  sport?: string
  price?: string
  [key: string]: string | undefined
}

/**
 * Sablon degiskenlerini doldur
 * {{tenant_name}} -> "BJK Tuzla Cimnastik"
 */
export function fillTemplate(
  template: string,
  vars: TemplateVariables
): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
    }
  }
  return result
}

/** Varsayilan Instagram sablonlari */
export const INSTAGRAM_TEMPLATES: Omit<SocialMediaTemplate, "id">[] = [
  {
    platform: "instagram",
    template_type: "post",
    title: "Deneme Dersi Davet",
    content: `🏆 {{tenant_name}} — Ücretsiz Deneme Dersi!

🗓 {{date}} {{time}}
📍 {{address}}

Çocuğunuzun sporla tanışması için harika bir fırsat!

✅ Profesyonel antrenörler
✅ Modern tesis
✅ Güvenli ortam

📞 Hemen kayıt: {{phone}}

#spor #cimnastik #cocukgelisimi #denemedersi #{{sport}}`,
    variables: [
      "tenant_name",
      "date",
      "time",
      "address",
      "phone",
      "sport",
    ],
    media_url: null,
  },
  {
    platform: "instagram",
    template_type: "story",
    title: "Haftalık Program",
    content: `📅 Bu Hafta {{tenant_name}}

{{sport}} Dersleri:
🔹 Pazartesi-Çarşamba-Cuma
🔹 Saat: {{time}}

💰 {{price}} / Aylık

Yerinizi ayırtın! 📞 {{phone}}`,
    variables: ["tenant_name", "sport", "time", "price", "phone"],
    media_url: null,
  },
  {
    platform: "instagram",
    template_type: "reel",
    title: "Sporcu Başarısı",
    content: `🌟 {{tenant_name}} sporcumuz harika bir performans sergiledi!

Tebrikler! 🎉

#{{sport}} #basari #gururverici`,
    variables: ["tenant_name", "sport"],
    media_url: null,
  },
]

/** Varsayilan WhatsApp sablonlari */
export const WHATSAPP_TEMPLATES: Omit<SocialMediaTemplate, "id">[] = [
  {
    platform: "whatsapp",
    template_type: "message",
    title: "Hoş Geldiniz Mesajı",
    content: `Merhaba! 👋

{{tenant_name}} ailesine hoş geldiniz!

Deneme dersiniz: {{date}} {{time}}
Adres: {{address}}

Yanınızda getirmeniz gerekenler:
✅ Spor kıyafeti
✅ Su şişesi
✅ Havlu

Görüşmek üzere! 🏆`,
    variables: ["tenant_name", "date", "time", "address"],
    media_url: null,
  },
  {
    platform: "whatsapp",
    template_type: "message",
    title: "Ödeme Hatırlatma",
    content: `Merhaba,

{{tenant_name}} aidat hatırlatması:

💰 Tutar: {{price}}
📅 Son ödeme: {{date}}

Ödeme için: veli.yisa-s.com

Teşekkürler! 🙏`,
    variables: ["tenant_name", "price", "date"],
    media_url: null,
  },
]

/** Varsayilan Facebook sablonlari */
export const FACEBOOK_TEMPLATES: Omit<SocialMediaTemplate, "id">[] = [
  {
    platform: "facebook",
    template_type: "post",
    title: "Kayıt Dönemi",
    content: `📢 {{tenant_name}} — Yeni Dönem Kayıtları Başladı!

🏅 Branşlarımız:
• Cimnastik
• Basketbol
• Voleybol
• Yüzme
• Futbol
• Tenis

📞 Bilgi ve kayıt: {{phone}}
📍 {{address}}

🌐 www.yisa-s.com

#sporokulukaydı #cocukgelisimi #{{sport}}`,
    variables: ["tenant_name", "phone", "address", "sport"],
    media_url: null,
  },
  {
    platform: "facebook",
    template_type: "cover",
    title: "Kapak Fotoğrafı Metni",
    content: `{{tenant_name}}
Teknolojiyi Spora Başlatıyoruz
📞 {{phone}}`,
    variables: ["tenant_name", "phone"],
    media_url: null,
  },
]

/** Tum varsayilan sablonlar */
export const ALL_DEFAULT_TEMPLATES = [
  ...INSTAGRAM_TEMPLATES,
  ...WHATSAPP_TEMPLATES,
  ...FACEBOOK_TEMPLATES,
]

/** Platform bazinda sablon filtrele */
export function getTemplatesByPlatform(
  templates: Omit<SocialMediaTemplate, "id">[],
  platform: Platform
): Omit<SocialMediaTemplate, "id">[] {
  return templates.filter((t) => t.platform === platform)
}

/** Sablon onizleme olustur */
export function generatePreview(
  template: Omit<SocialMediaTemplate, "id">,
  vars: TemplateVariables
): string {
  return fillTemplate(template.content, vars)
}
