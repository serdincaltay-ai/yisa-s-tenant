'use client'

import { AntrenorKartlari, type AntrenorKart } from '@/components/tesis/AntrenorKartlari'
import { FederasyonBilgileri, type FederasyonBilgileriProps } from '@/components/tesis/FederasyonBilgileri'

export type MediumTemplateProps = {
  tenant: { name?: string | null; ad?: string | null; description?: string | null }
  coaches: AntrenorKart[]
  federationInfo: FederasyonBilgileriProps[]
}

export default function MediumTemplate({ tenant, coaches, federationInfo }: MediumTemplateProps) {
  const title = tenant.name ?? tenant.ad ?? 'Tesis'
  const firstFederation = federationInfo[0]
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-100">{title}</h1>
          {tenant.description && (
            <p className="mt-2 text-zinc-400">{tenant.description}</p>
          )}
        </header>

        <div className="space-y-12">
          <AntrenorKartlari antrenorler={coaches} />
          {firstFederation && <FederasyonBilgileri {...firstFederation} />}
        </div>
      </div>
    </div>
  )
}
