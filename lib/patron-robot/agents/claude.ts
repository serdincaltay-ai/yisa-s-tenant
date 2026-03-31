// YİSA-S Patron Robot - Claude Agent (Anthropic)

import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

async function run(prompt: string): Promise<{ text: string; raw: unknown }> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return {
      text: `[CLAUDE-SIM] Demo yanıt: ${prompt.substring(0, 50)}...`,
      raw: { simulated: true },
    }
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
    system:
      "Sen YİSA-S platformunun Claude asistanısın. Güvenlik ve doğrulama uzmanısın. Türkçe yanıt ver.",
  })

  const textBlock = response.content.find((b) => b.type === "text")
  const text = textBlock && "text" in textBlock ? textBlock.text : ""
  return { text, raw: response }
}

export default { run }
