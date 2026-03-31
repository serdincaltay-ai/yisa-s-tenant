// YİSA-S Patron Robot - Router (Policy-based)
// v2.0 - Supabase, GitHub, Vercel eklendi

import type { TaskType } from "./types"

interface RoutePolicy {
  keywords: string[]
  taskType: TaskType
  primaryAgent: string
  fallbackAgent: string
}

const ROUTE_POLICIES: RoutePolicy[] = [
  {
    keywords: [
      "veritabanı",
      "database",
      "tablo",
      "kayıt",
      "üye",
      "müşteri",
      "randevu",
      "ödeme",
      "listele",
      "getir",
      "kaç tane",
      "sorgu",
      "supabase",
    ],
    taskType: "DATABASE",
    primaryAgent: "supabase",
    fallbackAgent: "gpt",
  },
  {
    keywords: [
      "github",
      "git",
      "repo",
      "commit",
      "branch",
      "pr",
      "pull request",
      "push",
      "merge",
      "issue",
      "kod geçmişi",
    ],
    taskType: "GIT",
    primaryAgent: "github",
    fallbackAgent: "gpt",
  },
  {
    keywords: [
      "vercel",
      "deploy",
      "yayınla",
      "domain",
      "hosting",
      "canlıya al",
      "production",
      "site yayını",
    ],
    taskType: "DEPLOY",
    primaryAgent: "vercel",
    fallbackAgent: "gpt",
  },
  {
    keywords: [
      "rapor",
      "report",
      "analiz",
      "data",
      "grafik",
      "chart",
      "dashboard",
      "istatistik",
      "konsolide",
      "özet",
    ],
    taskType: "DATA",
    primaryAgent: "gemini",
    fallbackAgent: "gpt",
  },
  {
    keywords: [
      "kod",
      "code",
      "script",
      "function",
      "api",
      "endpoint",
      "bug",
      "fix",
      "component",
      "react",
      "typescript",
    ],
    taskType: "DEV",
    primaryAgent: "gpt",
    fallbackAgent: "claude",
  },
  {
    keywords: [
      "ci",
      "cd",
      "pipeline",
      "docker",
      "kubernetes",
      "server",
      "terraform",
      "aws",
      "azure",
    ],
    taskType: "DEVOPS",
    primaryAgent: "gpt",
    fallbackAgent: "claude",
  },
  {
    keywords: [
      "içerik",
      "content",
      "metin",
      "text",
      "yazı",
      "blog",
      "makale",
      "email",
      "duyuru",
    ],
    taskType: "CONTENT",
    primaryAgent: "claude",
    fallbackAgent: "gpt",
  },
  {
    keywords: [
      "tasarım",
      "design",
      "ui",
      "ux",
      "figma",
      "layout",
      "renk",
      "tema",
    ],
    taskType: "DESIGN",
    primaryAgent: "gemini",
    fallbackAgent: "gpt",
  },
  {
    keywords: ["destek", "support", "yardım", "help", "soru", "question", "nasıl"],
    taskType: "SUPPORT",
    primaryAgent: "gpt",
    fallbackAgent: "claude",
  },
  {
    keywords: [
      "llama",
      "together",
      "hızlı",
      "ucuz",
      "basit",
      "alternatif",
      "ekonomik",
    ],
    taskType: "FAST",
    primaryAgent: "together",
    fallbackAgent: "gpt",
  },
]

export function routeCommand(text: string): { taskType: TaskType; agent: string } {
  const lower = text.toLowerCase()

  for (const policy of ROUTE_POLICIES) {
    if (policy.keywords.some((kw) => lower.includes(kw))) {
      return { taskType: policy.taskType, agent: policy.primaryAgent }
    }
  }

  return { taskType: "DEV", agent: "gpt" }
}

export function getAgentForTask(taskType: TaskType): string {
  const policy = ROUTE_POLICIES.find((p) => p.taskType === taskType)
  return policy?.primaryAgent || "gpt"
}

export function getAllPolicies(): RoutePolicy[] {
  return ROUTE_POLICIES
}
