import StandardTemplate from "@/components/tenant-templates/StandardTemplate"
import MediumTemplate from "@/components/tenant-templates/MediumTemplate"
import PremiumTemplate from "@/components/tenant-templates/PremiumTemplate"
import { headers } from "next/headers"
import { getTenantConfigWithOverrides } from "@/lib/tenant-settings-helper"

/* ------------------------------------------------------------------ */
/*  Tenant Site — Şablon Seçici (Template Router)                      */
/*  Subdomain slug'ına göre önce DB'den (tenant_settings) okur,        */
/*  yoksa statik config'e fallback yapar.                              */
/*  Şablon tipleri: standard | medium | premium                        */
/* ------------------------------------------------------------------ */

export default async function TenantSitePage() {
  const headersList = await headers()
  const slug = headersList.get("x-franchise-slug") ?? ""
  const config = await getTenantConfigWithOverrides(slug)

  switch (config.template) {
    case "standard":
      return <StandardTemplate config={config} />
    case "medium":
      return <MediumTemplate config={config} />
    case "premium":
    default:
      return <PremiumTemplate config={config} />
  }
}
