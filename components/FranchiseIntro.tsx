'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'franchise-intro-seen'

type FranchiseIntroProps = {
  tesisAdi?: string
  sahipAdi?: string
}

const TYPING_TEXT = 'YİSA-S Franchise Yönetim Sistemi'

export function FranchiseIntro({
  tesisAdi = 'Demo Tesis',
  sahipAdi = 'Sayın Yönetici',
}: FranchiseIntroProps) {
  const [visible, setVisible] = useState(false)
  const [typingDone, setTypingDone] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [showWelcome, setShowWelcome] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setVisible(false)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, '1')
      }
    }, 400)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(STORAGE_KEY)) return
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return
    let idx = 0
    const timer = setInterval(() => {
      idx++
      setTypedText(TYPING_TEXT.slice(0, idx))
      if (idx >= TYPING_TEXT.length) {
        clearInterval(timer)
        setTypingDone(true)
      }
    }, 35)
    return () => clearInterval(timer)
  }, [visible])

  useEffect(() => {
    if (!typingDone) return
    const t = setTimeout(() => setShowWelcome(true), 200)
    return () => clearTimeout(t)
  }, [typingDone])

  useEffect(() => {
    if (!visible || isClosing) return
    const t = setTimeout(handleClose, 3800)
    return () => clearTimeout(t)
  }, [visible, isClosing, handleClose])

  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={
        isClosing
          ? { opacity: 0, y: '-100%', transition: { duration: 0.4 } }
          : { opacity: 1, y: 0 }
      }
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a12]"
    >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(0, 212, 255, 0.15) 0%, transparent 70%), radial-gradient(ellipse at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 60%)',
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 z-10 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
          onClick={handleClose}
        >
          Atla
        </Button>
        <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
            style={{
              textShadow: '0 0 30px rgba(0, 212, 255, 0.4), 0 0 60px rgba(34, 197, 94, 0.2)',
            }}
          >
            {tesisAdi}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-6 text-lg text-muted-foreground sm:text-xl"
            style={{
              minHeight: '1.5em',
              fontFamily: 'monospace',
            }}
          >
            {typedText}
            {!typingDone && (
              <span
                className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-[#00d4ff]"
                style={{ animationDuration: '0.8s' }}
              />
            )}
          </motion.p>
          {showWelcome && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="mt-4 text-base text-foreground/90 sm:text-lg"
                style={{
                  textShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
                }}
              >
                Hoş geldiniz, {sahipAdi}
              </motion.p>
            )}
        </div>
    </motion.div>
  )
}
