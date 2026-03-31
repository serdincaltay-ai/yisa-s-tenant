// YİSA-S Patron Robot - Orchestrator
// Akış: PLAN → BUILD → CHECK → PREFLIGHT → RELEASE

import type {
  PatronCommand,
  Plan,
  BuildResult,
  CheckResult,
  OrchestratorResult,
} from "./types"
import { routeCommand } from "./router"
import { runPreflight } from "./preflight"
import { prepareRelease } from "./release"
import { logCommand } from "./audit"

import gpt from "./agents/gpt"
import claude from "./agents/claude"
import gemini from "./agents/gemini"
import together from "./agents/together"
import llamaOnPrem from "./agents/llamaOnPrem"
import v0 from "./agents/v0"
import cursor from "./agents/cursor"
import supabase from "./agents/supabase"
import github from "./agents/github"
import vercel from "./agents/vercel"

type AgentName =
  | "gpt"
  | "claude"
  | "gemini"
  | "together"
  | "llama"
  | "llamaOnPrem"
  | "v0"
  | "cursor"
  | "supabase"
  | "github"
  | "vercel"

async function callAgent(agent: string, plan: Plan): Promise<BuildResult> {
  const t0 = Date.now()
  const prompt = buildPromptForAgent(plan)

  const pack = (
    agentName: string,
    text: string,
    raw: unknown
  ): BuildResult => ({
    planId: plan.id,
    output: { message: text, raw },
    agent: agentName,
    buildTime: Date.now() - t0,
  })

  const safe = async (
    fn: () => Promise<{ text: string; raw: unknown }>,
    agentName: string
  ) => {
    try {
      const r = await fn()
      return pack(agentName, r.text, r.raw)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Agent hata"
      return pack(agentName, `[${agentName.toUpperCase()}] HATA: ${msg}`, {
        error: msg,
      })
    }
  }

  const a = (agent || "").toLowerCase() as AgentName

  switch (a) {
    case "gpt":
      return safe(() => gpt.run(prompt), "gpt")
    case "claude":
      return safe(() => claude.run(prompt), "claude")
    case "gemini":
      return safe(() => gemini.run(prompt), "gemini")
    case "together":
      return safe(() => together.run(prompt), "together")
    case "llama":
    case "llamaOnPrem":
      return safe(() => llamaOnPrem.run(prompt), "llamaOnPrem")
    case "v0":
      return safe(() => v0.run(prompt), "v0")
    case "cursor":
      return safe(() => cursor.run(prompt), "cursor")
    case "supabase":
      return safe(() => supabase.run(prompt), "supabase")
    case "github":
      return safe(() => github.run(prompt), "github")
    case "vercel":
      return safe(() => vercel.run(prompt), "vercel")
    default:
      return safe(() => gpt.run(prompt), "gpt")
  }
}

async function checkOutput(
  cmd: PatronCommand,
  plan: Plan,
  build: BuildResult
): Promise<CheckResult> {
  const checkerPrompt = `Sen YİSA-S CHECKER'sın.
Görev: Çıktıyı güvenlik ve tutarlılık açısından kontrol et.
- Tenant izolasyonu ihlali var mı?
- KVKK/PII sızıntısı var mı? (isim/telefon vb)
- Destructive (silme / geri dönüşsüz) öneri var mı?
- Rol/scope dışına taşma var mı?

Sadece JSON üret:
{
  "ok": boolean,
  "issues": string[],
  "warnings": string[]
}

CONTEXT:
tenantId=${cmd.tenantId}
mode=${cmd.mode}
stage=${cmd.requestedStage}
text="${cmd.text}"

PLAN:
intent=${plan.intent}
taskType=${plan.taskType}

BUILD_OUTPUT:
${String((build.output as { message?: string })?.message ?? "")}
`

  try {
    const r = await claude.run(checkerPrompt)
    const maybe = safeJson(r.text)
    if (maybe && typeof maybe.ok === "boolean") {
      return {
        ok: !!maybe.ok,
        issues: Array.isArray(maybe.issues) ? maybe.issues.map(String) : [],
        warnings: Array.isArray(maybe.warnings) ? maybe.warnings.map(String) : [],
        checkedBy: "claude",
      }
    }
  } catch {
    // fallthrough
  }

  if (cmd.mode === "LIVE") {
    return {
      ok: false,
      issues: [
        "Checker çalışmadı veya geçersiz çıktı döndü (LIVE modda bloklanır).",
      ],
      warnings: [],
      checkedBy: "claude",
    }
  }

  return {
    ok: true,
    issues: [],
    warnings: ["Checker çalışmadı (DEMO modda geçildi)."],
    checkedBy: "claude",
  }
}

export async function runPatronCommand(
  cmd: PatronCommand
): Promise<OrchestratorResult> {
  const startTime = Date.now()

  try {
    const { taskType, agent } = routeCommand(cmd.text)
    const plan: Plan = {
      id: `PLAN_${Date.now()}`,
      intent: extractIntent(cmd.text),
      taskType,
      params: { originalText: cmd.text },
      createdAt: new Date().toISOString(),
    }

    if (cmd.dryRun) {
      const result: OrchestratorResult = { status: "DRY_RUN", plan }
      logCommand(cmd, result, Date.now() - startTime)
      return result
    }

    const build = await callAgent(agent, plan)

    const buildMessage = String((build.output as { message?: string })?.message ?? "")
    if (cmd.mode === "LIVE" && buildMessage.includes(" HATA:")) {
      const result: OrchestratorResult = {
        status: "BLOCKED",
        plan,
        build,
        check: {
          ok: false,
          issues: ["Agent hatası (LIVE modda bloklandı)."],
          warnings: [],
          checkedBy: "claude",
        },
      }
      logCommand(cmd, result, Date.now() - startTime)
      return result
    }

    const check = await checkOutput(cmd, plan, build)
    if (!check.ok) {
      const result: OrchestratorResult = { status: "BLOCKED", plan, build, check }
      logCommand(cmd, result, Date.now() - startTime)
      return result
    }

    const preflight = runPreflight(cmd.tenantId, cmd.text)
    if (!preflight.ok) {
      const result: OrchestratorResult = {
        status: "BLOCKED",
        plan,
        build,
        check,
        preflight,
      }
      logCommand(cmd, result, Date.now() - startTime)
      return result
    }

    const release = prepareRelease(plan.id, preflight, cmd.requestedStage)

    const result: OrchestratorResult = {
      status: "RELEASE_READY",
      plan,
      build,
      check,
      preflight,
      release,
    }
    logCommand(cmd, result, Date.now() - startTime)
    return result
  } catch (error) {
    const result: OrchestratorResult = {
      status: "ERROR",
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
    }
    logCommand(cmd, result, Date.now() - startTime)
    return result
  }
}

function extractIntent(text: string): string {
  const lower = text.toLowerCase()

  if (lower.includes("güncelle") || lower.includes("update")) return "dev_update"
  if (lower.includes("oluştur") || lower.includes("create")) return "dev_create"
  if (lower.includes("sil") || lower.includes("delete")) return "dev_delete"
  if (lower.includes("rapor") || lower.includes("report")) return "data_report"
  if (lower.includes("analiz") || lower.includes("analyze")) return "data_analyze"
  if (lower.includes("deploy")) return "devops_deploy"

  return "general_task"
}

function buildPromptForAgent(plan: Plan): string {
  return `Sen YİSA-S ${plan.taskType} agent'sın.
Amaç: Patron komutunu yerine getir.

Komut:
${(plan.params as { originalText?: string })?.originalText ?? ""}

Beklenen:
- Açık, uygulanabilir çıktı
- Gerekirse madde madde
- Dashboard önerisi istenirse KPI + grafik öner

Sınırlar:
- Gerçek kişi/telefon vb PII uydurma
- Tenant izolasyonu ihlali yapma
`
}

function safeJson(text: string): {
  ok?: boolean
  issues?: string[]
  warnings?: string[]
} | null {
  try {
    const trimmed = text.trim()
    const cleaned = trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}
