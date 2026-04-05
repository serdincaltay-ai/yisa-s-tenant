import { NextRequest, NextResponse } from 'next/server'
import { getTenantConfigWithOverrides } from '@/lib/tenant-settings-helper'

export async function POST(req: NextRequest) {
  const { message, slug } = await req.json()

  if (!slug) {
    return NextResponse.json({ reply: 'Tesis bilgisi bulunamadı.' })
  }

  const config = await getTenantConfigWithOverrides(slug)
  const msg = (message ?? '').toLocaleLowerCase('tr')

  let reply = ''

  if (msg.includes('merhaba') || msg.includes('hoş geldin') || msg === '') {
    reply = `Merhaba! Hoş geldiniz. Burası ${config.ad}. Size nasıl yardımcı olabilirim?`
  } else if (msg.includes('ders') || msg.includes('program') || msg.includes('saat')) {
    reply = `${config.ad} ders programı için lütfen tesis ile iletişime geçin: ${config.telefon}`
  } else if (msg.includes('randevu')) {
    reply = config.whatsapp
      ? `Randevu için WhatsApp'tan ulaşabilirsiniz: wa.me/${config.whatsapp}`
      : `Randevu için arayın: ${config.telefon}`
  } else if (msg.includes('kayıt') || msg.includes('veli') || msg.includes('üyelik')) {
    reply = `Kayıt için ${config.telefon} numaralı hattı arayabilir veya tesisimize gelebilirsiniz.`
  } else if (msg.includes('branş') || msg.includes('spor')) {
    reply = `${config.ad}'da ${config.brans} branşında eğitim verilmektedir.`
  } else {
    reply = `${config.ad} hakkında merak ettiğiniz her şeyi sormaktan çekinmeyin.`
  }

  return NextResponse.json({ reply, tenantName: config.ad })
}
