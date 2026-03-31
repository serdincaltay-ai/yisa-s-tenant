// YİSA-S Patron Robot - GPT Agent (OpenAI)

import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

async function run(prompt: string): Promise<{ text: string; raw: unknown }> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      text: `[GPT-SIM] Demo yanıt: ${prompt.substring(0, 50)}...`,
      raw: { simulated: true },
    }
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Sen YİSA-S platformunun GPT asistanısın. Türkçe yanıt ver.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  })

  const text = response.choices[0]?.message?.content || ""
  return { text, raw: response }
}

export default { run }
