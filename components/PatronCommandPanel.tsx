"use client"

// YİSA-S Patron Panel - Komut Arayüzü
// v0.3.0 - Altılı Ortak Akıl İskeleti

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface CommandResult {
  status: string
  plan?: { intent: string; taskType: string }
  build?: {
    agent: string
    output: { message?: string; raw?: unknown }
  }
  check?: { ok: boolean; warnings: string[] }
  preflight?: {
    ok: boolean
    rbacOk: boolean
    lockStatus: { currentOwner: string | null }
  }
  release?: { stage: string; status: string; releaseId: string }
}

export default function PatronCommandPanel() {
  const [command, setCommand] = useState("")
  const [mode, setMode] = useState<"DEMO" | "LIVE">("DEMO")
  const [dryRun, setDryRun] = useState(true)
  const [stage, setStage] = useState<"STAGING" | "CANARY" | "PROD">("STAGING")
  const [tenant, setTenant] = useState("TENANT_DEMO")
  const [results, setResults] = useState<CommandResult[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { role?: string } } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) =>
      setUser(
        u
          ? {
              id: u.id,
              email: u.email ?? undefined,
              user_metadata: u.user_metadata as { role?: string } | undefined,
            }
          : null
      )
    )
  }, [])

  const handleCelfSubmit = async () => {
    if (!command.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/chat/flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: command.trim(), confirm_type: 'company', confirmed_first_step: true, skip_spelling: true, user, user_id: user?.id }),
      })
      const data = await res.json()
      if (data.text || data.status === 'awaiting_patron_approval') {
        setResults((prev) => [
          {
            status: "RELEASE_READY",
            build: {
              agent: "celf",
              output: {
                message: `${data.director_key ?? "CELF"} | ${(data.text ?? "").slice(0, 150)}...`,
              },
            },
          } as CommandResult,
          ...prev,
        ])
      } else {
        setResults((prev) => [
          {
            status: "ERROR",
            build: {
              agent: "celf",
              output: { message: data.error ?? "CELF hatası" },
            },
          } as CommandResult,
          ...prev,
        ])
      }
    } catch (e) {
      setResults((prev) => [
        {
          status: "ERROR",
          build: {
            agent: "celf",
            output: { message: e instanceof Error ? e.message : "Bağlantı hatası" },
          },
        } as CommandResult,
        ...prev,
      ])
    } finally {
      setCommand("")
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!command.trim()) return
    setLoading(true)

    try {
      const res = await fetch("/api/patron/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: command,
          tenantId: tenant,
          mode,
          dryRun,
          stage,
        }),
      })

      const result = (await res.json()) as CommandResult
      if (!res.ok) {
        setResults((prev) => [
          {
            status: "ERROR",
            plan: undefined,
            build: {
              agent: "api",
              output: {
                message: (result as { detail?: string })?.detail || "API hatası",
              },
            },
          } as CommandResult,
          ...prev,
        ])
      } else {
        setResults((prev) => [result, ...prev])
      }
    } catch (e) {
      setResults((prev) => [
        {
          status: "ERROR",
          build: {
            agent: "api",
            output: {
              message:
                e instanceof Error ? e.message : "Bağlantı hatası",
            },
          },
        } as CommandResult,
        ...prev,
      ])
    } finally {
      setCommand("")
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-[#111827] p-5 border border-[#1e293b]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#f8fafc] mb-1">
          Patron Komut Merkezi
        </h2>
        <p className="text-sm text-[#94a3b8]">
          Komut yazın, PLAN → BUILD → CHECK → PREFLIGHT → RELEASE akışı çalışır
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs text-[#94a3b8] mb-1">Tenant</label>
          <input
            type="text"
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            className="w-full bg-[#0a0e17] rounded-lg px-3 py-2 text-sm text-[#f8fafc] border border-[#1e293b] focus:border-[#10b981] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-[#94a3b8] mb-1">Mod</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "DEMO" | "LIVE")}
            className="w-full bg-[#0a0e17] rounded-lg px-3 py-2 text-sm text-[#f8fafc] border border-[#1e293b] focus:border-[#10b981] outline-none"
          >
            <option value="DEMO">DEMO</option>
            <option value="LIVE">LIVE</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#94a3b8] mb-1">Stage</label>
          <select
            value={stage}
            onChange={(e) =>
              setStage(e.target.value as "STAGING" | "CANARY" | "PROD")
            }
            className="w-full bg-[#0a0e17] rounded-lg px-3 py-2 text-sm text-[#f8fafc] border border-[#1e293b] focus:border-[#10b981] outline-none"
          >
            <option value="STAGING">STAGING</option>
            <option value="CANARY">CANARY</option>
            <option value="PROD">PROD</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#94a3b8] mb-1">Dry-Run</label>
          <button
            type="button"
            onClick={() => setDryRun(!dryRun)}
            className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition ${
              dryRun
                ? "bg-[#f97316]/80 hover:bg-[#f97316] text-white"
                : "bg-[#10b981]/80 hover:bg-[#10b981] text-white"
            }`}
          >
            {dryRun ? "AÇIK" : "KAPALI"}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Patron komutu yazın... (örn: butce raporu hazirla)"
          className="flex-1 bg-[#0a0e17] rounded-lg px-4 py-3 text-[#f8fafc] placeholder-[#94a3b8] border border-[#1e293b] focus:border-[#10b981] outline-none"
        />
        <button
          type="button"
          onClick={handleCelfSubmit}
          disabled={loading}
          className="bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 rounded-lg px-4 py-3 font-medium text-white transition"
          title="CELF'e gönder (CEO → Direktörlük)"
        >
          {loading ? "⏳" : "CELF"}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 rounded-lg px-4 py-3 font-medium text-white transition"
          title="Patron komut akışı"
        >
          {loading ? "⏳" : "Plan"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
          {results.map((result, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 border-l-4 ${
                result.status === "RELEASE_READY"
                  ? "border-[#10b981] bg-[#10b981]/10"
                  : result.status === "DRY_RUN"
                  ? "border-[#f97316] bg-[#f97316]/10"
                  : result.status === "BLOCKED" || result.status === "ERROR"
                  ? "border-[#ef4444] bg-[#ef4444]/10"
                  : "border-[#1e293b] bg-[#111827]"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    result.status === "RELEASE_READY"
                      ? "bg-[#10b981]/20 text-[#10b981]"
                      : result.status === "DRY_RUN"
                      ? "bg-[#f97316]/20 text-[#f97316]"
                      : "bg-[#ef4444]/20 text-[#ef4444]"
                  }`}
                >
                  {result.status}
                </span>
                <span className="text-[#94a3b8] text-xs">
                  {result.build?.agent?.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-[#94a3b8] space-y-1">
                {result.plan && (
                  <>
                    <p>
                      <span className="text-[#94a3b8]">Intent:</span>{" "}
                      {result.plan.intent}
                    </p>
                    <p>
                      <span className="text-[#94a3b8]">TaskType:</span>{" "}
                      {result.plan.taskType}
                    </p>
                  </>
                )}
                {result.build?.output?.message && (
                  <p className="text-[#94a3b8] truncate max-w-md">
                    {String(result.build.output.message).substring(0, 100)}...
                  </p>
                )}
                {result.release && (
                  <p>
                    <span className="text-[#94a3b8]">Release:</span>{" "}
                    {result.release.releaseId}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
