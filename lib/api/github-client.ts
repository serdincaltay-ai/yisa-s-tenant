/**
 * YİSA-S GitHub API istemcisi — Commit hazırlama / push
 * Otomatik deploy YAPMA; commit hazırla, push sadece Patron onayından sonra.
 * Tarih: 30 Ocak 2026
 */
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

function getKey(): string | undefined {
  const v = process.env.GITHUB_TOKEN
  return typeof v === 'string' ? v.trim() || undefined : undefined
}

export type GithubPrepareResult =
  | { ok: true; commitSha: string }
  | { ok: false; error: string }

/**
 * Repo'da commit hazırlar (blob + tree + commit). Push YAPMAZ.
 */
export async function githubPrepareCommit(params: {
  owner: string
  repo: string
  branch?: string
  message: string
  files: Array<{ path: string; content: string }>
}): Promise<GithubPrepareResult> {
  const token = getKey()
  if (!token) return { ok: false, error: 'GITHUB_TOKEN .env içinde tanımlı değil.' }

  const { owner, repo, branch = 'main', message, files } = params

  try {
    // 1) base ref
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    })
    const latestCommitSha = refData.object.sha

    // 2) base commit -> tree
    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    })
    const baseTreeSha = commitData.tree.sha

    // 3) blobs
    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        })
        return {
          path: file.path,
          sha: blob.sha,
          mode: '100644' as const,
          type: 'blob' as const,
        }
      }),
    )

    // 4) tree
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: blobs,
    })

    // 5) commit
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.sha,
      parents: [latestCommitSha],
    })

    return { ok: true, commitSha: newCommit.sha }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { ok: false, error: `githubPrepareCommit failed: ${errorMessage}` }
  }
}

/**
 * Hazırlanan commit'i branch'e push eder (ref update).
 */
export async function githubPush(params: {
  owner: string
  repo: string
  branch: string
  commitSha: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = getKey()
  if (!token) return { ok: false, error: 'GITHUB_TOKEN .env içinde tanımlı değil.' }

  const { owner, repo, branch, commitSha } = params

  try {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commitSha,
    })
    return { ok: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { ok: false, error: `githubPush failed: ${errorMessage}` }
  }
}

/**
 * Dosyaları commit hazırla + push et (tek çağrı kolaylığı)
 */
export async function githubCreateFiles(params: {
  owner: string
  repo: string
  branch?: string
  message: string
  files: Array<{ path: string; content: string }>
}): Promise<{ ok: true; commitSha: string } | { ok: false; error: string }> {
  const prepare = await githubPrepareCommit(params)
  if (!prepare.ok) return { ok: false, error: 'error' in prepare ? prepare.error : 'Prepare failed' }

  const push = await githubPush({
    owner: params.owner,
    repo: params.repo,
    branch: params.branch ?? 'main',
    commitSha: prepare.commitSha,
  })
  if (!push.ok) return { ok: false, error: 'error' in push ? push.error : 'Push failed' }

  return { ok: true, commitSha: prepare.commitSha }
}
