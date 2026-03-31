// YİSA-S Patron Robot - Vercel Agent

const VERCEL_API = "https://api.vercel.com"

async function run(prompt: string): Promise<{ text: string; raw: unknown }> {
  const token = process.env.VERCEL_TOKEN

  if (!token) {
    return {
      text: `[VERCEL-SIM] Demo yanıt (API key yok): ${prompt.substring(0, 50)}...

Vercel bağlantısı için .env dosyasına ekleyin:
- VERCEL_TOKEN=xxx...
- VERCEL_TEAM_ID=team_xxx (opsiyonel)

Token almak için: https://vercel.com/account/tokens`,
      raw: { simulated: true },
    }
  }

  try {
    const lower = prompt.toLowerCase()

    if (lower.includes("proje") || lower.includes("listele")) {
      return await handleProjects(token)
    }

    if (
      lower.includes("deploy") ||
      lower.includes("yayın") ||
      lower.includes("durum")
    ) {
      return await handleDeployments(token)
    }

    if (lower.includes("domain") || lower.includes("alan adı")) {
      return await handleDomains(token)
    }

    if (lower.includes("yayınla") || lower.includes("deploy et")) {
      return await handleNewDeploy(token, prompt)
    }

    return await handleProjects(token)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Vercel hatası"
    return {
      text: `[VERCEL] HATA: ${msg}`,
      raw: { error: msg },
    }
  }
}

async function handleProjects(token: string): Promise<{
  text: string
  raw: unknown
}> {
  const teamId = process.env.VERCEL_TEAM_ID
  const url = teamId
    ? `${VERCEL_API}/v9/projects?teamId=${teamId}`
    : `${VERCEL_API}/v9/projects`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      text: `[VERCEL] API Hatası: ${(data as { error?: { message?: string } }).error?.message || "Bilinmeyen hata"}`,
      raw: data,
    }
  }

  const projects = (data as { projects?: unknown[] }).projects || []

  if (projects.length === 0) {
    return {
      text: `[VERCEL] Henüz proje yok. Vercel dashboard'dan proje oluşturun.`,
      raw: data,
    }
  }

  type Proj = { name?: string; targets?: { production?: { alias?: string[] } } }
  const projectList = (projects as Proj[])
    .slice(0, 10)
    .map((p) => {
      const domain =
        p.targets?.production?.alias?.[0] || (p.name || "") + ".vercel.app"
      return `- ${p.name} → ${domain}`
    })
    .join("\n")

  return {
    text: `[VERCEL] Projeler (${projects.length}):

${projectList}`,
    raw: data,
  }
}

async function handleDeployments(token: string): Promise<{
  text: string
  raw: unknown
}> {
  const teamId = process.env.VERCEL_TEAM_ID
  const url = teamId
    ? `${VERCEL_API}/v6/deployments?teamId=${teamId}&limit=5`
    : `${VERCEL_API}/v6/deployments?limit=5`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      text: `[VERCEL] API Hatası: ${(data as { error?: { message?: string } }).error?.message || "Bilinmeyen hata"}`,
      raw: data,
    }
  }

  const deployments =
    (data as { deployments?: { name?: string; created?: string; state?: string; url?: string }[] })
      .deployments || []

  if (deployments.length === 0) {
    return {
      text: `[VERCEL] Henüz deploy yok.`,
      raw: data,
    }
  }

  const deployList = deployments
    .map((d) => {
      const date = new Date(d.created || "").toLocaleDateString("tr-TR")
      const status =
        d.state === "READY" ? "✅" : d.state === "ERROR" ? "❌" : "⏳"
      return `- ${status} ${d.name} (${date}) → ${d.url || "URL yok"}`
    })
    .join("\n")

  return {
    text: `[VERCEL] Son Deploy'lar:

${deployList}`,
    raw: data,
  }
}

async function handleDomains(token: string): Promise<{
  text: string
  raw: unknown
}> {
  const teamId = process.env.VERCEL_TEAM_ID
  const url = teamId
    ? `${VERCEL_API}/v5/domains?teamId=${teamId}`
    : `${VERCEL_API}/v5/domains`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      text: `[VERCEL] API Hatası: ${(data as { error?: { message?: string } }).error?.message || "Bilinmeyen hata"}`,
      raw: data,
    }
  }

  const domains = (data as { domains?: { name?: string; verified?: boolean }[] })
    .domains || []

  if (domains.length === 0) {
    return {
      text: `[VERCEL] Henüz domain eklenmemiş.`,
      raw: data,
    }
  }

  const domainList = domains
    .map((d) => {
      const verified = d.verified ? "✅" : "⏳"
      return `- ${verified} ${d.name}`
    })
    .join("\n")

  return {
    text: `[VERCEL] Domain'ler:

${domainList}`,
    raw: data,
  }
}

async function handleNewDeploy(
  _token: string,
  _prompt: string
): Promise<{ text: string; raw: unknown }> {
  return {
    text: `[VERCEL] Deploy Hazırlığı:

⚠️ Güvenlik: Otomatik deploy devre dışı.

Manuel deploy için:
1. GitHub'a push yapın
2. Vercel otomatik deploy edecek

Veya Vercel Dashboard'dan:
https://vercel.com/dashboard

Komut satırından:
\`\`\`
vercel --prod
\`\`\``,
    raw: { action: "deploy_info", requiresManual: true },
  }
}

export default { run }
