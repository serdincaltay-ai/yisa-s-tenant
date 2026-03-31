import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { requirePatronOrFlow } from '@/lib/auth/api-auth'
import { insertAuditLog } from '@/lib/db/ceo-celf'

/** CELF sohbetinden CEO havuzuna (10'a Çıkart) komut gönder */
export async function POST(req: NextRequest) {
  try {
    const auth = await requirePatronOrFlow()
    if (auth instanceof NextResponse) return auth
    const userId = auth.user.id
    const userEmail = auth.user.email ?? 'Patron'

    const body = await req.json()
    const messages = Array.isArray(body.messages) ? body.messages : []
    const assignedAI = typeof body.assignedAI === 'string' ? body.assignedAI : 'CLAUDE'

    if (messages.length === 0) {
      return NextResponse.json({ error: 'Gönderilecek mesaj yok.' }, { status: 400 })
    }

    const db = getSupabaseServer()
    if (!db) {
      return NextResponse.json({ error: 'Veritabanı bağlantısı yok' }, { status: 503 })
    }

    const firstUserMsg = messages.find((m: { role?: string }) => m.role === 'user')
    const command = typeof firstUserMsg?.content === 'string'
      ? firstUserMsg.content.slice(0, 200)
      : 'CELF sohbeti'

    const displayText = messages
      .map((m: { role?: string; content?: string; ai?: string }) => {
        const role = m.role === 'user' ? 'Patron' : (m.ai ?? 'Asistan')
        return `[${role}]: ${m.content ?? ''}`
      })
      .join('\n\n')

    const assistantNames: Record<string, string> = {
      CLAUDE: 'Claude',
      GPT: 'ChatGPT',
      GEMINI: 'Gemini',
      V0: 'v0',
      CURSOR: 'Cursor',
      TOGETHER: 'Together',
    }
    const assistantName = assistantNames[assignedAI.toUpperCase()] ?? assignedAI

    const ticketNo = generateTicketNo()

    const outputPayload: Record<string, unknown> = {
      displayText,
      assistant_summary: `${assistantName} ile ${messages.length} mesajlık sohbet — Patron onayı bekleniyor.`,
      director_key: assignedAI.toUpperCase(),
      director_name: assistantName,
      sent_by_email: userEmail,
      source: 'celf_chat',
      task_type: 'onay',
      task_name: command,
    }

    outputPayload.ticket_no = ticketNo
    outputPayload.type = 'celf_chat'
    outputPayload.title = `${assistantName}: ${command.slice(0, 80)}`

    const { data: inserted, error } = await db
      .from('patron_commands')
      .insert({
        user_id: userId,
        command,
        status: 'pending',
        output_payload: outputPayload,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Kayıt oluşturulamadı: ' + error.message }, { status: 500 })
    }

    await insertAuditLog({
      action: 'celf_send_to_ceo',
      entity_type: 'patron_command',
      entity_id: inserted?.id,
      user_id: userId,
      payload: { assignedAI, message_count: messages.length, ticket_no: ticketNo },
    })

    return NextResponse.json({
      ok: true,
      command_id: inserted?.id,
      ticket_no: ticketNo,
      message: "Komut 10'a Çıkart havuzuna gönderildi.",
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'CEO\'ya gönderim hatası', detail: err }, { status: 500 })
  }
}

function generateTicketNo(): string {
  const now = new Date()
  const yy = now.getFullYear().toString().slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const seq = String(Math.floor(1000 + Math.random() * 9000))
  return `${yy}${mm}${dd}-${seq}`
}
