/**
 * .env Sema Dogrulama Scripti
 *
 * .env.example'daki tum degiskenlerin .env (veya .env.local) dosyasinda
 * tanimli olup olmadigini kontrol eder.
 *
 * Kurallar:
 *   - .env.example'da YORUM SATIRINDA OLMAYAN degiskenler → ZORUNLU
 *   - .env.example'da # ile baslayanlar → OPSIYONEL (uyari verir, hata degil)
 *   - Bos deger ("KEY=") zorunlu icin HATA, opsiyonel icin OK
 *
 * Kullanim:  npx tsx scripts/check-env.ts
 *            npm run check:env
 *
 * CI'da:     build oncesi calistirilir, eksik zorunlu var ise exit 1
 */

import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── Helpers ────────────────────────────────────────────────────────────────

interface EnvVar {
  name: string
  required: boolean
  line: number
}

/**
 * .env.example dosyasini parse eder.
 * Yorum satirindaki degiskenler (# KEY=...) opsiyonel,
 * diger satirlardakiler zorunlu olarak isaretlenir.
 */
function parseEnvExample(filePath: string): EnvVar[] {
  const content = readFileSync(filePath, 'utf-8')
  const vars: EnvVar[] = []

  content.split('\n').forEach((rawLine, idx) => {
    const line = rawLine.trim()

    // Bos satir veya sadece yorum (aciklama) satirlari atla
    if (!line || (line.startsWith('#') && !line.includes('='))) return

    // # KEY=value seklindeki satirlar → opsiyonel degisken
    const commentedMatch = line.match(/^#\s*([A-Z_][A-Z0-9_]*)=/)
    if (commentedMatch) {
      vars.push({ name: commentedMatch[1], required: false, line: idx + 1 })
      return
    }

    // KEY=value seklindeki satirlar → zorunlu degisken
    const plainMatch = line.match(/^([A-Z_][A-Z0-9_]*)=/)
    if (plainMatch) {
      vars.push({ name: plainMatch[1], required: true, line: idx + 1 })
    }
  })

  return vars
}

/**
 * .env veya .env.local dosyasini parse eder.
 * Deger bos olsa bile anahtar tanimli sayilir (bos kontrol ayri yapilir).
 */
function parseEnvFile(filePath: string): Map<string, string> {
  if (!existsSync(filePath)) return new Map()

  const content = readFileSync(filePath, 'utf-8')
  const map = new Map<string, string>()

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue

    const key = line.slice(0, eqIdx).trim()
    const val = line.slice(eqIdx + 1).trim()
    // Tirnak isaretlerini kaldir
    const cleaned = val.replace(/^["']|["']$/g, '')
    map.set(key, cleaned)
  }

  return map
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  // Script scripts/ altinda, root bir ust dizin (Windows: pathname /C:/... çift sürücü hatası vermesin)
  const scriptDir =
    typeof import.meta.dirname === 'string'
      ? import.meta.dirname
      : dirname(fileURLToPath(import.meta.url))
  const root = resolve(scriptDir, '..')
  const examplePath = resolve(root, '.env.example')

  if (!existsSync(examplePath)) {
    console.error('HATA: .env.example dosyasi bulunamadi:', examplePath)
    process.exit(1)
  }

  // .env.local ve .env dosyalarini oku (Next.js onceligi: .env.local > .env)
  const envLocal = parseEnvFile(resolve(root, '.env.local'))
  const envFile = parseEnvFile(resolve(root, '.env'))

  // CI ortaminda process.env'den de kontrol et
  const isCI = Boolean(process.env.CI)

  const expected = parseEnvExample(examplePath)

  const errors: string[] = []
  const warnings: string[] = []

  let requiredCount = 0
  let optionalCount = 0
  let missingRequired = 0
  let missingOptional = 0

  for (const v of expected) {
    const inEnvLocal = envLocal.has(v.name)
    const inEnvFile = envFile.has(v.name)
    const inProcessEnv = v.name in process.env

    const defined = inEnvLocal || inEnvFile || inProcessEnv

    if (v.required) {
      requiredCount++
      if (!defined) {
        missingRequired++
        errors.push(`  EKSIK  [zorunlu]   ${v.name}  (.env.example satir ${v.line})`)
      } else {
        // Bos deger kontrolu (zorunlu icin)
        const val = envLocal.get(v.name) ?? envFile.get(v.name) ?? process.env[v.name] ?? ''
        if (!val) {
          missingRequired++
          errors.push(`  BOS    [zorunlu]   ${v.name}  (.env.example satir ${v.line})`)
        }
      }
    } else {
      optionalCount++
      if (!defined) {
        missingOptional++
        warnings.push(`  EKSIK  [opsiyonel] ${v.name}  (.env.example satir ${v.line})`)
      }
    }
  }

  // Production (Vercel): Stripe key'leri zorunlu — online ödeme için
  const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  if (isProduction) {
    const stripeVars = ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'] as const
    for (const key of stripeVars) {
      const val = (envLocal.get(key) ?? envFile.get(key) ?? process.env[key] ?? '').trim()
      if (!val) {
        errors.push(`  EKSIK/BOS [production] ${key}  (Vercel Environment Variables'da tanimli olmali)`)
      }
    }
  }

  // ─── Rapor ──────────────────────────────────────────────────────────────

  console.log('')
  console.log('━━━ .env Sema Dogrulama ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Kaynak:    ${examplePath}`)
  console.log(`  Ortam:     ${isCI ? 'CI' : 'Lokal'}`)
  console.log(`  Zorunlu:   ${requiredCount - missingRequired}/${requiredCount} tanimli`)
  console.log(`  Opsiyonel: ${optionalCount - missingOptional}/${optionalCount} tanimli`)
  console.log('')

  if (errors.length > 0) {
    console.log('HATALAR (zorunlu degiskenler):')
    for (const e of errors) console.log(e)
    console.log('')
  }

  if (warnings.length > 0) {
    console.log('UYARILAR (opsiyonel degiskenler):')
    for (const w of warnings) console.log(w)
    console.log('')
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('  Tum degiskenler tanimli. Sorun yok.')
    console.log('')
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  // Zorunlu eksik varsa CI/build'i durdur
  if (errors.length > 0) {
    console.error(`${errors.length} zorunlu degisken eksik veya bos. Cikis kodu: 1`)
    process.exit(1)
  }
}

main()
