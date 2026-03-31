/**
 * Duyuru Email Template
 * Genel duyuru emaili — tesis yoneticisi tarafindan velilere/antrenorlere gonderilir.
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
import sanitizeHtml from 'sanitize-html'

export interface DuyuruProps {
  /** Alici adi */
  aliciAd: string
  /** Tesis adi */
  tesisAdi: string
  /** Duyuru basligi */
  baslik: string
  /** Duyuru icerigi (HTML destekli) */
  icerik: string
  /** Gonderen kisi (ornek: "Ali Yilmaz — Tesis Muduru") */
  gonderen?: string
}

export function Duyuru({
  aliciAd = 'Sayın Kullanıcı',
  tesisAdi = 'YiSA-S Tesis',
  baslik = 'Duyuru',
  icerik = '',
  gonderen,
}: DuyuruProps) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>{baslik} - {tesisAdi}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerBannerStyle}>
            <Text style={bannerTitleStyle}>{tesisAdi}</Text>
          </Section>
          <Heading style={headingStyle}>{baslik}</Heading>
          <Hr style={hrStyle} />
          <Text style={textStyle}>Merhaba {aliciAd},</Text>
          <Section style={contentBoxStyle}>
            <Text
              style={contentTextStyle}
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(icerik, {
                  allowedTags: ['p', 'strong', 'em', 'b', 'i', 'br', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'span'],
                  allowedAttributes: {
                    a: ['href', 'target'],
                    span: ['style'],
                  },
                  allowedSchemes: ['https', 'mailto'],
                }),
              }}
            />
          </Section>
          {gonderen ? (
            <Text style={senderStyle}>— {gonderen}</Text>
          ) : null}
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

const headerBannerStyle: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  borderRadius: '8px 8px 0 0',
  margin: '-32px -40px 24px',
  padding: '16px 40px',
  textAlign: 'center' as const,
}

const bannerTitleStyle: React.CSSProperties = {
  color: '#00d4ff',
  fontSize: '20px',
  fontWeight: 700,
  letterSpacing: '1px',
  margin: 0,
}

const headingStyle: React.CSSProperties = {
  color: '#1a1a2e',
  fontSize: '22px',
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

const contentBoxStyle: React.CSSProperties = {
  backgroundColor: '#fafafa',
  borderRadius: '6px',
  margin: '16px 0',
  padding: '16px 20px',
}

const contentTextStyle: React.CSSProperties = {
  color: '#1f2937',
  fontSize: '15px',
  lineHeight: '26px',
  margin: 0,
}

const senderStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '16px 0 8px',
  textAlign: 'right' as const,
}

const footerStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
}

export default Duyuru
