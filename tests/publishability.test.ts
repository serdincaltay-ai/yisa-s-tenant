import { describe, expect, it } from 'vitest'
import { computeMissingRequiredSlots } from '@/lib/templates/publishability'

const REQUIRED = ['hero', 'program', 'kayit', 'iletisim', 'cta']

describe('computeMissingRequiredSlots', () => {
  it('returns missing required keys when required slots are empty', () => {
    const missing = computeMissingRequiredSlots(
      [
        { slot_key: 'hero', is_active: true, icerik: {} },
        { slot_key: 'program', is_active: true, icerik: { title: 'Haftalık Plan' } },
        { slot_key: 'kayit', is_active: false, icerik: { button: 'Kayıt Ol' } },
      ],
      REQUIRED
    )

    expect(missing).toEqual(['hero', 'kayit', 'iletisim', 'cta'])
  })

  it('accepts publish state when all required slots are filled and active', () => {
    const missing = computeMissingRequiredSlots(
      [
        { slot_key: 'hero', is_active: true, icerik: { title: 'Hero' } },
        { slot_key: 'program', is_active: true, icerik: { rows: [] } },
        { slot_key: 'kayit', is_active: true, icerik: { form: true } },
        { slot_key: 'iletisim', is_active: true, icerik: { phone: '5300000000' } },
        { slot_key: 'cta', is_active: true, icerik: { label: 'Deneme Al' } },
      ],
      REQUIRED
    )

    expect(missing).toEqual([])
  })
})
