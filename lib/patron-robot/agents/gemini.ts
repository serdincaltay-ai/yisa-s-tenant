// YİSA-S Patron Robot - Gemini Agent (Google AI)

import { GoogleGenerativeAI } from "@google/generative-ai"

async function run(prompt: string): Promise<{ text: string; raw: unknown }> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY

  if (!apiKey) {
    return {
      text: `[GEMINI-SIM] Demo yanıt: ${prompt.substring(0, 50)}...`,
      raw: { simulated: true },
    }
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Sen YİSA-S platformunun Gemini asistanısın. Veri analizi ve dashboard uzmanısın. Türkçe yanıt ver.\n\n${prompt}`,
          },
        ],
      },
    ],
  })

  const response = result.response
  const text = response.text() || ""
  return { text, raw: response }
}

export default { run }
