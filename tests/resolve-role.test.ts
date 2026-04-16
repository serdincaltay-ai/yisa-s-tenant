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

  it('maps mudur and isletme_muduru to branch_manager', () => {
    const roleFromMudur = resolveLoginRole({
      userId: 'u2a',
      email: 'mudur@example.com',
      profilesRole: 'mudur',
    })
    const roleFromIsletme = resolveLoginRole({
      userId: 'u2b',
      email: 'isletme@example.com',
      userTenantsRole: 'isletme_muduru',
    })

    expect(roleFromMudur).toBe('branch_manager')
    expect(roleFromIsletme).toBe('branch_manager')
    expect(ROLE_TO_PATH[roleFromMudur]).toBe('/isletme-muduru')
  })

  it('maps sportif_direktor to sports_director', () => {
    const role = resolveLoginRole({
      userId: 'u2c',
      email: 'sd@example.com',
      profilesRole: 'sportif_direktor',
    })

    expect(role).toBe('sports_director')
    expect(ROLE_TO_PATH[role]).toBe('/sportif-direktor')
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
