import { describe, expect, it } from 'vitest'
import { getPanelFromHost } from '@/lib/subdomain'

describe('subdomain panel resolution smoke', () => {
  it('resolves app subdomain to patron panel', () => {
    expect(getPanelFromHost('app.yisa-s.com')).toBe('patron')
  })

  it('resolves unknown tenant subdomain to franchise_site panel', () => {
    expect(getPanelFromHost('bjktuzlacimnastik.yisa-s.com')).toBe('franchise_site')
  })

  it('resolves root domain to www panel', () => {
    expect(getPanelFromHost('yisa-s.com')).toBe('www')
  })
})
