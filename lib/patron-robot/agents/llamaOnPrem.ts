// YİSA-S Patron Robot - LLaMA On-Premise Agent

async function run(prompt: string): Promise<{ text: string; raw: unknown }> {
  const endpoint =
    process.env.LLAMA_ENDPOINT || "http://localhost:8000"

  if (!endpoint || endpoint.includes("localhost")) {
    return {
      text: `[LLAMA-SIM] Demo yanıt (on-prem sunucu yok): ${prompt.substring(0, 50)}...`,
      raw: { simulated: true, endpoint },
    }
  }

  try {
    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3-70b",
        messages: [
          {
            role: "system",
            content:
              "Sen YİSA-S platformunun yerel LLaMA asistanısın. Premium müşteri verileriyle çalışıyorsun. Türkçe yanıt ver.",
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
  } catch (error) {
    return {
      text: `[LLAMA-ERROR] On-prem sunucuya bağlanılamadı: ${endpoint}`,
      raw: { error: String(error), endpoint },
    }
  }
}

function isPremiumTenant(tenantId: string): boolean {
  const premiumTenants = (process.env.PREMIUM_TENANTS || "").split(",")
  return premiumTenants.includes(tenantId)
}

export default { run, isPremiumTenant }
