'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeMessage {
  id: string
  tenant_id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface UseMessagesOptions {
  /** Current user ID */
  userId: string | null
  /** The other user in conversation (coach or parent) */
  partnerId: string | null
  /** Tenant ID for scoping */
  tenantId: string | null
}

/**
 * Supabase Realtime subscription hook for veli <-> coach messaging.
 * Subscribes to INSERT events on veli_coach_messages filtered by
 * the current conversation pair.
 */
export function useRealtimeMessages({ userId, partnerId, tenantId }: UseMessagesOptions) {
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Fetch existing messages for this conversation
  const fetchMessages = useCallback(async () => {
    if (!userId || !partnerId || !tenantId) {
      setMessages([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('veli_coach_messages')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
      )
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data as RealtimeMessage[])
    }
    setLoading(false)
  }, [userId, partnerId, tenantId])

  // Subscribe to realtime changes
  useEffect(() => {
    if (!userId || !partnerId || !tenantId) return

    fetchMessages()

    const channel = supabase
      .channel(`vcm:${userId}:${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'veli_coach_messages',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const newMsg = payload.new as RealtimeMessage
          // Only add if it belongs to this conversation
          const isOurs =
            (newMsg.sender_id === userId && newMsg.receiver_id === partnerId) ||
            (newMsg.sender_id === partnerId && newMsg.receiver_id === userId)
          if (isOurs) {
            setMessages((prev) => {
              // Prevent duplicates
              if (prev.some((m) => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'veli_coach_messages',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const updated = payload.new as RealtimeMessage
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          )
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, partnerId, tenantId, fetchMessages])

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!userId || !partnerId || !tenantId || !content.trim()) return null

      const { data, error } = await supabase
        .from('veli_coach_messages')
        .insert({
          tenant_id: tenantId,
          sender_id: userId,
          receiver_id: partnerId,
          content: content.trim(),
        })
        .select()
        .single()

      if (error) {
        console.error('[useRealtimeMessages] send error:', error)
        return null
      }

      return data as RealtimeMessage
    },
    [userId, partnerId, tenantId]
  )

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!userId || !partnerId || !tenantId) return

    await supabase
      .from('veli_coach_messages')
      .update({ is_read: true })
      .eq('tenant_id', tenantId)
      .eq('sender_id', partnerId)
      .eq('receiver_id', userId)
      .eq('is_read', false)

    setMessages((prev) =>
      prev.map((m) =>
        m.sender_id === partnerId && m.receiver_id === userId && !m.is_read
          ? { ...m, is_read: true }
          : m
      )
    )
  }, [userId, partnerId, tenantId])

  return { messages, loading, sendMessage, markAsRead, refetch: fetchMessages }
}
