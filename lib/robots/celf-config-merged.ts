/**
 * YİSA-S CELF — Kod + DB birleştirilmiş direktörlük konfigürasyonu
 * director_rules tablosunda kayıt varsa onu kullanır (dinamik); yoksa celf-center varsayılanı.
 * Tarih: 30 Ocak 2026
 */

import { CELF_DIRECTORATES, type DirectorKey, type Directorate, type CelfAIProvider } from './celf-center'
import { getDirectorRuleByKey } from '@/lib/db/director-rules-db'

const VALID_PROVIDERS: CelfAIProvider[] = ['GPT', 'CLAUDE', 'GEMINI', 'TOGETHER', 'V0', 'CURSOR']

function validProviders(arr: string[] | undefined): CelfAIProvider[] {
  if (!arr?.length) return []
  return arr.filter((p): p is CelfAIProvider => VALID_PROVIDERS.includes(p as CelfAIProvider)) as CelfAIProvider[]
}

/**
 * Direktörlük konfigürasyonunu döner: önce DB (director_rules), yoksa kod varsayılanı.
 * Dinamik güncelleme: Patron onayı ile director_rules güncellenince buradan yansır.
 */
export async function getDirectorateConfigMerged(directorKey: DirectorKey): Promise<Directorate> {
  const defaults = CELF_DIRECTORATES[directorKey]
  if (!defaults) {
    return {
      name: directorKey,
      tasks: [],
      triggers: [],
      work: 'Genel',
      aiProviders: ['GPT'],
    }
  }
  const { data: dbRow } = await getDirectorRuleByKey(directorKey)
  if (!dbRow) return defaults

  return {
    ...defaults,
    aiProviders: validProviders(dbRow.ai_providers).length > 0 ? validProviders(dbRow.ai_providers) : defaults.aiProviders,
    triggers: (dbRow.triggers?.length ? dbRow.triggers : defaults.triggers) as string[],
    dataAccess: (dbRow.data_access?.length ? dbRow.data_access : defaults.dataAccess) as string[] | undefined,
    readOnly: (dbRow.read_only?.length ? dbRow.read_only : defaults.readOnly) as string[] | undefined,
    protectedData: (dbRow.protected_data?.length ? dbRow.protected_data : defaults.protectedData) as string[] | undefined,
    requiresApproval: (dbRow.requires_approval?.length ? dbRow.requires_approval : defaults.requiresApproval) as string[] | undefined,
    hasVeto: dbRow.has_veto ?? defaults.hasVeto,
  }
}

/** Senkron varsayılan: DB'ye bakmadan kod varsayılanını döner (geriye uyumluluk) */
export function getDirectorAIProvidersSync(directorKey: DirectorKey): CelfAIProvider[] {
  return CELF_DIRECTORATES[directorKey]?.aiProviders ?? ['GPT']
}
