// YİSA-S Patron Robot - Together Agent (Llama, Mixtral vb.)

async function run(prompt: string): Promise<{ text: string; raw: unknown }> {
  const apiKey = process.env.TOGETHER_API_KEY

  if (!apiKey) {
    return {
      text: `[TOGETHER-SIM] Demo yanıt: ${prompt.substring(0, 50)}...`,
      raw: { simulated: true },
    }
  }

  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/Llama-3-70b-chat-hf",
      messages: [
        {
          role: "system",
          content: "Sen YİSA-S platformunun Together asistanısın. Türkçe yanıt ver.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  })

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ""
  return { text, raw: data }
}

export default { run }
