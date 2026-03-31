/**
 * Chat mesajlarını Supabase chat_messages tablosuna yazar.
 * API route'lardan çağrılır (sunucu tarafı).
 */

import { getSupabaseServer } from '@/lib/supabase'

export interface SaveChatMessageParams {
  user_id: string
  message: string
  response: string
  ai_providers?: string[]
}

export async function saveChatMessage(params: SaveChatMessageParams): Promise<{ id?: string; error?: string }> {
  const db = getSupabaseServer()
  if (!db) return { error: 'Supabase bağlantısı yok' }

  const { error, data } = await db
    .from('chat_messages')
    .insert({
      user_id: params.user_id,
      message: params.message,
      response: params.response,
      ai_providers: params.ai_providers ?? [],
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data?.id }
}
