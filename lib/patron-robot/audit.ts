// YİSA-S Patron Robot - Audit Logging
import type { OrchestratorResult, PatronCommand } from "./types"

interface AuditEntry {
  timestamp: string
  tenantId: string
  command: string
  result: string
  duration: number
  agent?: string
}

const auditLog: AuditEntry[] = []

export function logCommand(
  cmd: PatronCommand,
  result: OrchestratorResult,
  duration: number
): void {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    tenantId: cmd.tenantId,
    command: cmd.text.substring(0, 100),
    result: result.status,
    duration,
    agent: result.build?.agent,
  }
  auditLog.push(entry)
}

export function getAuditLog(): AuditEntry[] {
  return [...auditLog]
}

export function clearAuditLog(): void {
  auditLog.length = 0
}
