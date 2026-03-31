// YİSA-S Patron Robot - Preflight
// RBAC + Tenant Isolation + Locks + Critical Business Rules (Unit System)

import { getLockStatus } from "./locks"
import type { PreflightResult } from "./types"

export function runPreflight(tenantId: string, text: string): PreflightResult {
  const warnings: string[] = []
  const ruleHits: string[] = []

  const lockStatus = getLockStatus()

  const rbacOk = true
  const tenantIsolationOk = !!tenantId && tenantId.length > 0

  const lower = (text || "").toLowerCase()
  const isDestructive =
    lower.includes("sil") ||
    lower.includes("delete") ||
    lower.includes("drop") ||
    lower.includes("truncate") ||
    lower.includes("formatla")

  const numbers = extractUnitNumbers(lower)
  for (const n of numbers) {
    const v = n.value
    const isBranchContext =
      n.context.includes("şube") ||
      n.context.includes("kapasite") ||
      n.context.includes("toplam")

    if (!isBranchContext) {
      if (v > 12) {
        ruleHits.push(`HARD_BLOCK: Personel birim ${v} > 12 (imkânsız)`)
        return {
          ok: false,
          rbacOk,
          tenantIsolationOk,
          destructiveBlocked: false,
          lockStatus,
        }
      }
      if (v < 12) {
        warnings.push(`Düşük kullanım: Personel birim ${v} < 12`)
        ruleHits.push(`WARN: Personel birim ${v} < 12`)
      }
    } else {
      if (v > 18.5) {
        warnings.push(`Aşırı yük: Şube kapasitesi ${v} > 18.5 (uyarı)`)
        ruleHits.push(`WARN: Şube kapasitesi ${v} > 18.5`)
      }
    }
  }

  if (
    lower.includes("birim başı gelir") &&
    (lower.includes("düş") || lower.includes("azal"))
  ) {
    ruleHits.push("SUGGEST: Birim başı gelir düşüşü")
  }

  if (isDestructive) {
    ruleHits.push("HARD_BLOCK: Destructive komut algılandı")
    return {
      ok: false,
      rbacOk,
      tenantIsolationOk,
      destructiveBlocked: true,
      lockStatus,
    }
  }

  const ok =
    rbacOk &&
    tenantIsolationOk &&
    lockStatus.ownerLockOk &&
    lockStatus.destructiveLockOk

  return {
    ok,
    rbacOk,
    tenantIsolationOk,
    destructiveBlocked: false,
    lockStatus,
  }
}

function extractUnitNumbers(
  lower: string
): { value: number; context: string }[] {
  const res: { value: number; context: string }[] = []
  const re = /(\d+(?:[.,]\d+)?)\s*(?:birim|unit)\b/g
  let m: RegExpExecArray | null

  while ((m = re.exec(lower)) !== null) {
    const raw = m[1].replace(",", ".")
    const value = Number(raw)
    if (!Number.isFinite(value)) continue

    const start = Math.max(0, m.index - 20)
    const end = Math.min(lower.length, m.index + 20)
    const context = lower.slice(start, end)

    res.push({ value, context })
  }
  return res
}

export function formatPreflightReport(result: PreflightResult): string {
  const lines: string[] = []
  lines.push("=== PREFLIGHT REPORT ===")
  lines.push(`RBAC: ${result.rbacOk ? "✓" : "✗"}`)
  lines.push(`Tenant Isolation: ${result.tenantIsolationOk ? "✓" : "✗"}`)
  lines.push(`Destructive Blocked: ${result.destructiveBlocked ? "YES" : "NO"}`)
  lines.push(`Owner Lock: ${result.lockStatus.ownerLockOk ? "✓" : "✗"}`)
  lines.push(`Overall: ${result.ok ? "PASS" : "FAIL"}`)
  return lines.join("\n")
}
