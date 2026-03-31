// YİSA-S Patron Robot - GitHub Agent

import { Octokit } from "@octokit/rest"

let octokit: Octokit | null = null

function getClient(): Octokit | null {
  const token = process.env.GITHUB_TOKEN

  if (!token) {
    return null
  }

  if (!octokit) {
    octokit = new Octokit({ auth: token })
  }

  return octokit
}

async function run(prompt: string): Promise<{ text: string; raw: unknown }> {
  const client = getClient()

  if (!client) {
    return {
      text: `[GITHUB-SIM] Demo yanıt (API key yok): ${prompt.substring(0, 50)}...

GitHub bağlantısı için .env dosyasına ekleyin:
- GITHUB_TOKEN=ghp_xxx...
- GITHUB_OWNER=kullanici-adi
- GITHUB_REPO=repo-adi

Token almak için: https://github.com/settings/tokens`,
      raw: { simulated: true },
    }
  }

  const owner = process.env.GITHUB_OWNER || process.env.GITHUB_REPO_OWNER || ""
  const repo = process.env.GITHUB_REPO || process.env.GITHUB_REPO_NAME || ""

  if (!owner || !repo) {
    return {
      text: `[GITHUB] HATA: GITHUB_OWNER ve GITHUB_REPO tanımlı değil.

.env dosyasına ekleyin:
GITHUB_OWNER=serdincaltay
GITHUB_REPO=yisa-s`,
      raw: { error: "missing_config" },
    }
  }

  try {
    const lower = prompt.toLowerCase()

    if (
      lower.includes("repo") ||
      lower.includes("durum") ||
      lower.includes("bilgi")
    ) {
      return await handleRepoInfo(client, owner, repo)
    }

    if (lower.includes("branch") || lower.includes("dal")) {
      return await handleBranches(client, owner, repo)
    }

    if (lower.includes("commit") || lower.includes("değişiklik")) {
      return await handleCommits(client, owner, repo)
    }

    if (
      lower.includes("pr") ||
      lower.includes("pull request") ||
      lower.includes("merge")
    ) {
      return await handlePRs(client, owner, repo)
    }

    if (
      lower.includes("issue") ||
      lower.includes("sorun") ||
      lower.includes("görev")
    ) {
      return await handleIssues(client, owner, repo)
    }

    if (lower.includes("dosya") || lower.includes("kod") || lower.includes("oku")) {
      return await handleFileContent(client, owner, repo, prompt)
    }

    return await handleRepoInfo(client, owner, repo)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "GitHub hatası"
    return {
      text: `[GITHUB] HATA: ${msg}`,
      raw: { error: msg },
    }
  }
}

async function handleRepoInfo(
  client: Octokit,
  owner: string,
  repo: string
): Promise<{ text: string; raw: unknown }> {
  const { data } = await client.repos.get({ owner, repo })

  return {
    text: `[GITHUB] Repo Bilgisi:

📁 ${data.full_name}
📝 ${data.description || "Açıklama yok"}
⭐ ${data.stargazers_count} yıldız
🍴 ${data.forks_count} fork
🌿 Ana branch: ${data.default_branch}
📅 Son güncelleme: ${new Date(data.updated_at!).toLocaleDateString("tr-TR")}
🔗 ${data.html_url}`,
    raw: data,
  }
}

async function handleBranches(
  client: Octokit,
  owner: string,
  repo: string
): Promise<{ text: string; raw: unknown }> {
  const { data } = await client.repos.listBranches({
    owner,
    repo,
    per_page: 10,
  })

  const branchList = data
    .map((b) => `- ${b.name}${b.protected ? " 🔒" : ""}`)
    .join("\n")

  return {
    text: `[GITHUB] Branch Listesi (${data.length}):

${branchList}`,
    raw: data,
  }
}

async function handleCommits(
  client: Octokit,
  owner: string,
  repo: string
): Promise<{ text: string; raw: unknown }> {
  const { data } = await client.repos.listCommits({
    owner,
    repo,
    per_page: 5,
  })

  const commitList = data
    .map((c) => {
      const date = new Date(c.commit.author?.date || "").toLocaleDateString(
        "tr-TR"
      )
      const msg = c.commit.message.split("\n")[0].substring(0, 50)
      return `- ${date}: ${msg}`
    })
    .join("\n")

  return {
    text: `[GITHUB] Son 5 Commit:

${commitList}`,
    raw: data,
  }
}

async function handlePRs(
  client: Octokit,
  owner: string,
  repo: string
): Promise<{ text: string; raw: unknown }> {
  const { data } = await client.pulls.list({
    owner,
    repo,
    state: "open",
    per_page: 10,
  })

  if (data.length === 0) {
    return {
      text: `[GITHUB] Açık PR yok.`,
      raw: data,
    }
  }

  const prList = data
    .map((pr) => `- #${pr.number}: ${pr.title} (${pr.user?.login})`)
    .join("\n")

  return {
    text: `[GITHUB] Açık PR'lar (${data.length}):

${prList}`,
    raw: data,
  }
}

async function handleIssues(
  client: Octokit,
  owner: string,
  repo: string
): Promise<{ text: string; raw: unknown }> {
  const { data } = await client.issues.listForRepo({
    owner,
    repo,
    state: "open",
    per_page: 10,
  })

  if (data.length === 0) {
    return {
      text: `[GITHUB] Açık issue yok.`,
      raw: data,
    }
  }

  const issueList = data.map((i) => `- #${i.number}: ${i.title}`).join("\n")

  return {
    text: `[GITHUB] Açık Issue'lar (${data.length}):

${issueList}`,
    raw: data,
  }
}

async function handleFileContent(
  client: Octokit,
  owner: string,
  repo: string,
  prompt: string
): Promise<{ text: string; raw: unknown }> {
  const pathMatch = prompt.match(/(?:dosya|oku|göster)\s+([^\s]+)/i)
  const path = pathMatch ? pathMatch[1] : "README.md"

  try {
    const { data } = await client.repos.getContent({ owner, repo, path })

    if ("content" in data) {
      const content = Buffer.from(data.content, "base64").toString("utf-8")
      return {
        text: `[GITHUB] Dosya: ${path}

\`\`\`
${content.substring(0, 1000)}${content.length > 1000 ? "\n... (devamı kesildi)" : ""}
\`\`\``,
        raw: { path, size: data.size },
      }
    }

    return {
      text: `[GITHUB] ${path} bir klasör, dosya değil.`,
      raw: data,
    }
  } catch {
    return {
      text: `[GITHUB] Dosya bulunamadı: ${path}`,
      raw: { error: "not_found", path },
    }
  }
}

export default { run, getClient }
