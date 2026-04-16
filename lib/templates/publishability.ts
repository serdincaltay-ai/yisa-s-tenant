export interface TenantTemplateSlotInput {
  slot_key: string
  icerik: Record<string, unknown> | null
  is_active: boolean
}

export function computeMissingRequiredSlots(
  slots: TenantTemplateSlotInput[],
  requiredSlotKeys: string[]
): string[] {
  const filledKeys = slots
    .filter((slot) => slot.is_active && slot.icerik && Object.keys(slot.icerik).length > 0)
    .map((slot) => slot.slot_key)

  return requiredSlotKeys.filter((key) => !filledKeys.includes(key))
}
