/**
 * Yoklama Hatirlatma Email Template
 * Antrenor veya veliye yoklama hatirlatmasi gonderir.
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Preview,
} from '@react-email/components'
import * as React from 'react'

export interface YoklamaHatirlatmaProps {
  /** Alici adi */
  aliciAd: string
  /** Tesis / kulup adi */
  tesisAdi: string
  /** Ders adi */
  dersAdi: string
  /** Ders tarihi (ornek: "12 Mart 2026, Persembe") */
  dersTarihi: string
  /** Ders saati (ornek: "14:00") */
  dersSaati: string
}

export function YoklamaHatirlatma({
  aliciAd = 'Sayın Kullanıcı',
  tesisAdi = 'YiSA-S Tesis',
  dersAdi = 'Genel Cimnastik',
  dersTarihi = '',
  dersSaati = '',
}: YoklamaHatirlatmaProps) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>Yoklama Hatırlatması - {dersAdi}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Yoklama Hatırlatması</Heading>
          <Hr style={hrStyle} />
          <Text style={textStyle}>Merhaba {aliciAd},</Text>
          <Text style={textStyle}>
            <strong>{tesisAdi}</strong> bünyesindeki dersiniz için yoklama
            hatırlatması:
          </Text>
          <Section style={infoBoxStyle}>
            <Text style={infoTextStyle}>
              <strong>Ders:</strong> {dersAdi}
            </Text>
            <Text style={infoTextStyle}>
              <strong>Tarih:</strong> {dersTarihi}
            </Text>
            <Text style={infoTextStyle}>
              <strong>Saat:</strong> {dersSaati}
            </Text>
          </Section>
          <Text style={textStyle}>
            Lütfen yoklama kaydını zamanında tamamlayın.
          </Text>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            Bu email {tesisAdi} tarafından YiSA-S platformu üzerinden
            gönderilmiştir.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#f4f4f7',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '40px auto',
  maxWidth: '560px',
  padding: '32px 40px',
}

const headingStyle: React.CSSProperties = {
  color: '#1a1a2e',
  fontSize: '24px',
  fontWeight: 700,
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

const hrStyle: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const textStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
}

const infoBoxStyle: React.CSSProperties = {
  backgroundColor: '#f0f9ff',
  borderLeft: '4px solid #0ea5e9',
  borderRadius: '4px',
  margin: '16px 0',
  padding: '12px 16px',
}

const infoTextStyle: React.CSSProperties = {
  color: '#1e3a5f',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '4px 0',
}

const footerStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
}

export default YoklamaHatirlatma
