import { describe, expect, it } from 'vitest'
import { resolveLoginRole, ROLE_TO_PATH } from '@/lib/auth/resolve-role'

describe('resolveLoginRole', () => {
  it('maps patron e-mail to patron role with highest priority', () => {
    const role = resolveLoginRole({
      userId: 'u1',
      email: 'serdincaltay@gmail.com',
      userMetadata: { role: 'veli' },
      profilesRole: 'veli',
      kullanicilarRolKod: 'ROL-10',
    })

    expect(role).toBe('patron')
    expect(ROLE_TO_PATH[role]).toBe('/dashboard')
  })

  it('maps branch owner variants to tenant_owner path', () => {
    const role = resolveLoginRole({
      userId: 'u2',
      email: 'kullanici@example.com',
      profilesRole: 'owner',
    })

    expect(role).toBe('tenant_owner')
    expect(ROLE_TO_PATH[role]).toBe('/franchise')
  })

  it('falls back to default parent role', () => {
    const role = resolveLoginRole({
      userId: 'u3',
      email: 'veli@example.com',
    })

    expect(role).toBe('veli')
    expect(ROLE_TO_PATH[role]).toBe('/veli')
  })

  it('maps assistant coach to assistant coach panel', () => {
    const role = resolveLoginRole({
      userId: 'u4',
      email: 'yardimci@example.com',
      userTenantsRole: 'assistant_coach',
    })

    expect(role).toBe('assistant_coach')
    expect(ROLE_TO_PATH[role]).toBe('/assistant-coach')
  })

  it('maps security staff to security panel', () => {
    const role = resolveLoginRole({
      userId: 'u5',
      email: 'guvenlik@example.com',
      userTenantsRole: 'security_staff',
    })

    expect(role).toBe('security_staff')
    expect(ROLE_TO_PATH[role]).toBe('/security-staff')
  })
})
