/**
 * 429 / Too Many Requests geldiğinde 3 saniye bekleyip tekrar dener.
 * AI API'leri (OpenAI, Anthropic, Google, vb.) rate limit verince kullanılır.
 * Body okunmaz; çağıran taraf res.json() / res.text() kullanabilir.
 */

const RETRY_DELAY_MS = 3000
const MAX_RETRIES = 2

/**
 * fetch ile aynı imza; status 429 gelirse RETRY_DELAY_MS bekleyip
 * en fazla MAX_RETRIES kez tekrar dener.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { maxRetries?: number; delayMs?: number }
): Promise<Response> {
  const maxRetries = options?.maxRetries ?? MAX_RETRIES
  const delayMs = options?.delayMs ?? RETRY_DELAY_MS

  let lastRes: Response | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(input, init)
    lastRes = res

    if (res.ok) return res
    if (res.status !== 429) return res

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  return lastRes!
}
