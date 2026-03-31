// YİSA-S Patron Robot - Supabase Agent
// Veritabanı, Auth, Storage, Realtime işlemleri

import { createClient, SupabaseClient } from "@supabase/supabase-js"

let supabase: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY

  if (!url || !key) {
    return null
  }

  if (!supabase) {
    supabase = createClient(url, key)
  }

  return supabase
}

async function run(prompt: string): Promise<{ text: string; raw: unknown }> {
  const client = getClient()

  if (!client) {
    return {
      text: `[SUPABASE-SIM] Demo yanıt (API key yok): ${prompt.substring(0, 50)}...

Supabase bağlantısı için .env dosyasına ekleyin:
- NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
- SUPABASE_SERVICE_ROLE_KEY=eyJ... (opsiyonel, admin işlemler için)`,
      raw: { simulated: true },
    }
  }

  try {
    const lower = prompt.toLowerCase()

    if (
      lower.includes("listele") ||
      lower.includes("getir") ||
      lower.includes("kaç")
    ) {
      return await handleQuery(client, prompt)
    }

    if (
      lower.includes("ekle") ||
      lower.includes("kaydet") ||
      lower.includes("oluştur")
    ) {
      return await handleInsert(client, prompt)
    }

    if (lower.includes("güncelle") || lower.includes("değiştir")) {
      return await handleUpdate(client, prompt)
    }

    if (lower.includes("sil") || lower.includes("kaldır")) {
      return {
        text:
          "[SUPABASE] Silme işlemi Preflight'ta bloklandı. Destructive komutlar için özel izin gerekli.",
        raw: { blocked: true, reason: "destructive" },
      }
    }

    return await handleStatus(client, prompt)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Supabase hatası"
    return {
      text: `[SUPABASE] HATA: ${msg}`,
      raw: { error: msg },
    }
  }
}

async function handleQuery(
  client: SupabaseClient,
  prompt: string
): Promise<{ text: string; raw: unknown }> {
  const tables = [
    "franchises",
    "users",
    "appointments",
    "payments",
    "members",
    "branches",
    "staff",
  ]
  let targetTable = "franchises"

  for (const table of tables) {
    if (
      prompt.toLowerCase().includes(table) ||
      prompt.toLowerCase().includes(table.slice(0, -1))
    ) {
      targetTable = table
      break
    }
  }

  if (prompt.includes("üye") || prompt.includes("müşteri")) targetTable = "members"
  if (prompt.includes("randevu")) targetTable = "appointments"
  if (prompt.includes("ödeme") || prompt.includes("gelir"))
    targetTable = "payments"
  if (prompt.includes("şube")) targetTable = "branches"
  if (prompt.includes("personel") || prompt.includes("çalışan"))
    targetTable = "staff"
  if (prompt.includes("franchise")) targetTable = "franchises"

  const { data, error, count } = await client
    .from(targetTable)
    .select("*", { count: "exact" })
    .limit(10)

  if (error) {
    return {
      text: `[SUPABASE] Tablo sorgulanamadı: ${error.message}`,
      raw: { error: error.message, table: targetTable },
    }
  }

  return {
    text: `[SUPABASE] ${targetTable} tablosu:
- Toplam kayıt: ${count ?? 0}
- Son 10 kayıt getirildi

${data && data.length > 0 ? JSON.stringify(data, null, 2).substring(0, 500) + "..." : "Kayıt bulunamadı."}`,
    raw: { table: targetTable, count, data },
  }
}

async function handleInsert(
  _client: SupabaseClient,
  _prompt: string
): Promise<{ text: string; raw: unknown }> {
  return {
    text: `[SUPABASE] Veri ekleme işlemi hazırlandı.

⚠️ Güvenlik: Gerçek veri eklemek için:
1. Patron onayı gerekli
2. LIVE modda olmalı
3. Preflight kontrolü geçmeli

Örnek komut:
> /mode LIVE
> Yeni üye ekle: Ad=Test, Tel=555-1234`,
    raw: { action: "insert_prepared", requiresApproval: true },
  }
}

async function handleUpdate(
  _client: SupabaseClient,
  _prompt: string
): Promise<{ text: string; raw: unknown }> {
  return {
    text: `[SUPABASE] Güncelleme işlemi hazırlandı.

⚠️ Güvenlik: Gerçek güncelleme için:
1. Patron onayı gerekli
2. LIVE modda olmalı
3. Hangi kaydın güncelleneceği belirtilmeli (ID)

Örnek komut:
> /mode LIVE
> Üye güncelle ID=123: Tel=555-9999`,
    raw: { action: "update_prepared", requiresApproval: true },
  }
}

async function handleStatus(
  client: SupabaseClient,
  _prompt: string
): Promise<{ text: string; raw: unknown }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  let connected = false
  let errorMsg = ""

  try {
    const { error } = await client.from("franchises").select("id").limit(1)
    connected = !error
    if (error) errorMsg = error.message
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e)
  }

  return {
    text: `[SUPABASE] Veritabanı Durumu:
- Bağlantı: ${connected ? "✅ Aktif" : "❌ Hata"}
- URL: ${url?.substring(0, 30)}...
- Proje: Bağlı

Kullanılabilir komutlar:
- "Üyeleri listele"
- "Kaç randevu var?"
- "Şube gelirlerini getir"
- "Yeni üye ekle"${errorMsg ? `\n\nHata: ${errorMsg}` : ""}`,
    raw: { status: connected ? "connected" : "error", error: errorMsg },
  }
}

export default { run, getClient }
