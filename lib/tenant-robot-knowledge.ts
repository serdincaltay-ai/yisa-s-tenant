import { getTenantConfigWithOverrides } from './tenant-settings-helper'

export async function getTenantKnowledge(slug: string) {
  const config = await getTenantConfigWithOverrides(slug)
  return {
    tenantName: config.ad,
    phone: config.telefon,
    whatsapp: config.whatsapp,
    branch: config.brans,
    address: config.adres,
  }
}
