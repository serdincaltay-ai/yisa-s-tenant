/**
 * Hosgeldiniz Email Template
 * Yeni tenant olusturuldugunda franchise sahibine gonderilir.
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
  Link,
  Preview,
} from '@react-email/components'
import * as React from 'react'

export interface HosgeldinizProps {
  /** Franchise sahibinin adi */
  ownerAd: string
  /** Tesis / isletme adi */
  tesisAdi: string
  /** Giris email adresi */
  loginEmail: string
  /** Gecici sifre (opsiyonel — mevcut kullanici ise gonderilmez) */
  tempPassword?: string
  /** Subdomain (ornek: "bjk-tuzla") */
  subdomain?: string
  /** Platform URL */
  platformUrl?: string
}

export function Hosgeldiniz({
  ownerAd = 'Sayın İşletme Sahibi',
  tesisAdi = 'Yeni Tesis',
  loginEmail = '',
  tempPassword,
  subdomain,
  platformUrl = 'https://yisa-s.com',
}: HosgeldinizProps) {
  const panelUrl = subdomain
    ? `https://${subdomain}.yisa-s.com`
    : platformUrl

  return (
    <Html lang="tr">
      <Head />
      <Preview>YiSA-S&apos;e Hoşgeldiniz - {tesisAdi}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={logoBannerStyle}>
            <Text style={logoTextStyle}>YiSA-S</Text>
          </Section>
          <Heading style={headingStyle}>Hoşgeldiniz!</Heading>
          <Hr style={hrStyle} />
          <Text style={textStyle}>Merhaba {ownerAd},</Text>
          <Text style={textStyle}>
            <strong>{tesisAdi}</strong> için YiSA-S platformunda yeriniz
            hazır! Spor tesisi yönetim panelinize hemen erişebilirsiniz.
          </Text>

          <Section style={infoBoxStyle}>
            <Text style={infoTextStyle}>
              <strong>Giris Bilgileri:</strong>
            </Text>
            <Text style={infoTextStyle}>
              <strong>Email:</strong> {loginEmail}
            </Text>
            {tempPassword ? (
              <Text style={infoTextStyle}>
                <strong>Geçici Şifre:</strong> {tempPassword}
              </Text>
            ) : null}
            {subdomain ? (
              <Text style={infoTextStyle}>
                <strong>Panel Adresi:</strong>{' '}
                <Link href={panelUrl} style={linkStyle}>
                  {panelUrl}
                </Link>
              </Text>
            ) : null}
          </Section>

          {tempPassword ? (
            <Text style={warningStyle}>
              Güvenliğiniz için ilk girişinizde şifrenizi değiştirmenizi
              öneririz.
            </Text>
          ) : null}

          <Text style={textStyle}>
            Panelinizdeki kurulum sihirbazı ile tesisinizi hızlıca
            yapılandırabilirsiniz. Sorularınız için destek ekibimize
            ulaşabilirsiniz.
          </Text>

          <Section style={ctaBoxStyle}>
            <Link href={panelUrl} style={ctaButtonStyle}>
              Panele Git
            </Link>
          </Section>

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            Bu email YiSA-S platformu tarafından otomatik olarak
            gönderilmiştir.
          </Text>
          <Text style={footerStyle}>
            <Link href={platformUrl} style={footerLinkStyle}>
              yisa-s.com
            </Link>
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

const logoBannerStyle: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  borderRadius: '8px 8px 0 0',
  margin: '-32px -40px 24px',
  padding: '20px 40px',
  textAlign: 'center' as const,
}

const logoTextStyle: React.CSSProperties = {
  color: '#00d4ff',
  fontSize: '28px',
  fontWeight: 800,
  letterSpacing: '2px',
  margin: 0,
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
  backgroundColor: '#f0fdf4',
  borderLeft: '4px solid #22c55e',
  borderRadius: '4px',
  margin: '16px 0',
  padding: '12px 16px',
}

const infoTextStyle: React.CSSProperties = {
  color: '#14532d',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '4px 0',
}

const linkStyle: React.CSSProperties = {
  color: '#0ea5e9',
  textDecoration: 'underline',
}

const warningStyle: React.CSSProperties = {
  backgroundColor: '#fef3c7',
  borderRadius: '4px',
  color: '#92400e',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '12px 0',
  padding: '8px 12px',
}

const ctaBoxStyle: React.CSSProperties = {
  margin: '24px 0',
  textAlign: 'center' as const,
}

const ctaButtonStyle: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '12px 32px',
  textDecoration: 'none',
}

const footerStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
}

const footerLinkStyle: React.CSSProperties = {
  color: '#6b7280',
  textDecoration: 'underline',
}

export default Hosgeldiniz
