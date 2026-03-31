'use client'

import React from 'react'
import { Shield, Phone, Users, Building2, Dumbbell } from 'lucide-react'

type IlTemsilcisi = {
  adi: string
  bransi: string
  telefon: string
}

type YarisanKulup = {
  kulup_adi: string
  adres?: string
  telefon?: string
}

/** Eski prop yapısı — hardcoded veriden gelen */
type LegacyKulup = {
  isim: string
  sehir?: string
}

export interface FederasyonBilgileriProps {
  /** federation_info tablosundan gelen veriler */
  federasyonAdi?: string
  branch?: string
  il?: string
  ilce?: string
  temsilciAdi?: string
  temsilciBransi?: string
  temsilciTelefonu?: string
  yarismaKulupleri?: YarisanKulup[]
  /** Eski (hardcoded) prop desteği */
  ilTemsilcisi?: IlTemsilcisi
  yarisanKulupler?: LegacyKulup[]
}

export function FederasyonBilgileri({
  federasyonAdi,
  branch,
  il,
  ilce,
  temsilciAdi,
  temsilciBransi,
  temsilciTelefonu,
  yarismaKulupleri,
  ilTemsilcisi,
  yarisanKulupler,
}: FederasyonBilgileriProps) {
  // Yeni DB verileri varsa onları kullan, yoksa eski hardcoded prop'ları
  const tAdi = temsilciAdi ?? ilTemsilcisi?.adi
  const tBransi = temsilciBransi ?? ilTemsilcisi?.bransi ?? branch
  const tTelefon = temsilciTelefonu ?? ilTemsilcisi?.telefon

  const hasTemsilci = !!tAdi
  const hasKulupler = (yarismaKulupleri && yarismaKulupleri.length > 0) || (yarisanKulupler && yarisanKulupler.length > 0)

  if (!hasTemsilci && !hasKulupler && !federasyonAdi) return null

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-cyan-400" strokeWidth={1.5} />
        {federasyonAdi ?? 'Federasyon Bilgileri'}
      </h2>

      {/* Branş + İl bilgisi */}
      {(branch || il) && (
        <div className="flex items-center gap-3 mb-4 text-xs text-zinc-400">
          {branch && (
            <span className="flex items-center gap-1 bg-cyan-400/10 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-400/20">
              <Dumbbell className="h-3 w-3" strokeWidth={1.5} />
              {branch}
            </span>
          )}
          {il && (
            <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full border border-zinc-700">
              {il}{ilce ? ` / ${ilce}` : ''}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* İl Temsilcisi */}
        {hasTemsilci && (
          <div className="glass-panel p-5 border border-zinc-800">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
              İl Temsilcisi
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-zinc-500">Ad</p>
                <p className="text-sm text-white font-medium">{tAdi}</p>
              </div>
              {tBransi && (
                <div>
                  <p className="text-xs text-zinc-500">Branş</p>
                  <p className="text-sm text-white">{tBransi}</p>
                </div>
              )}
              {tTelefon && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-cyan-400" strokeWidth={1.5} />
                  <a href={`tel:${tTelefon}`} className="text-sm text-cyan-400 hover:text-cyan-300">
                    {tTelefon}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Yarışan Kulüpler — DB verisi (yarisma_kulupleri JSONB) */}
        {yarismaKulupleri && yarismaKulupleri.length > 0 && (
          <div className="glass-panel p-5 border border-zinc-800">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
              Federasyonda Yarışan Kulüpler
            </h3>
            <div className="space-y-2">
              {yarismaKulupleri.map((k) => (
                <div key={k.kulup_adi} className="flex items-center gap-2 rounded-xl border border-zinc-700 p-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 text-xs font-bold shrink-0">
                    {k.kulup_adi[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{k.kulup_adi}</p>
                    {k.adres && <p className="text-[10px] text-zinc-500 truncate">{k.adres}</p>}
                  </div>
                  {k.telefon && (
                    <a href={`tel:${k.telefon}`} className="text-cyan-400 hover:text-cyan-300 shrink-0">
                      <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eski hardcoded kulüp listesi (geriye uyumluluk) */}
        {!yarismaKulupleri?.length && yarisanKulupler && yarisanKulupler.length > 0 && (
          <div className="glass-panel p-5 border border-zinc-800">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
              Federasyonda Yarışan Kulüpler
            </h3>
            <div className="space-y-2">
              {yarisanKulupler.map((k) => (
                <div key={k.isim} className="flex items-center gap-2 rounded-xl border border-zinc-700 p-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 text-xs font-bold shrink-0">
                    {k.isim[0]}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{k.isim}</p>
                    {k.sehir && <p className="text-[10px] text-zinc-500">{k.sehir}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
