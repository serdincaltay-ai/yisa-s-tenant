// YİSA-S Patron Robot - Type Definitions
// v0.3.0 - Altılı Ortak Akıl İskeleti

export type TaskType =
  | "DEV"
  | "DEVOPS"
  | "DATA"
  | "CONTENT"
  | "DESIGN"
  | "SUPPORT"
  | "DATABASE"
  | "GIT"
  | "DEPLOY"
  | "FAST"
export type Mode = "LIVE" | "DEMO"
export type Stage = "STAGING" | "CANARY" | "PROD"

export interface PatronCommand {
  tenantId: string
  mode: Mode
  text: string
  dryRun: boolean
  requestedStage?: Stage
}

export interface Plan {
  id: string
  intent: string
  taskType: TaskType
  params: Record<string, unknown>
  createdAt: string
}

export interface BuildResult {
  planId: string
  output: unknown
  agent: string
  buildTime: number
}

export interface CheckResult {
  ok: boolean
  issues: string[]
  warnings: string[]
  checkedBy: string
}

export interface PreflightResult {
  ok: boolean
  rbacOk: boolean
  tenantIsolationOk: boolean
  destructiveBlocked: boolean
  lockStatus: LockStatus
}

export interface LockStatus {
  ownerLockOk: boolean
  destructiveLockOk: boolean
  currentOwner: string | null
}

export interface ReleaseResult {
  stage: Stage
  status: "READY" | "BLOCKED" | "PENDING"
  releaseId: string
}

export interface OrchestratorResult {
  status: "DRY_RUN" | "RELEASE_READY" | "BLOCKED" | "ERROR"
  plan?: Plan
  build?: BuildResult
  check?: CheckResult
  preflight?: PreflightResult
  release?: ReleaseResult
  error?: string
}
