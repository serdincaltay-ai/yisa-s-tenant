'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'

const STORAGE_KEY = 'veli-intro-seen'

export function VeliIntro() {
  const [visible, setVisible] = useState(false)
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
    if (!visible || isClosing) return
    const t = setTimeout(handleClose, 3000)
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(37, 99, 235, 0.2) 0%, transparent 70%)',
        }}
      />
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-4 top-4 z-10 min-h-[44px] min-w-[44px] text-gray-600 hover:text-gray-900"
        onClick={handleClose}
      >
        Atla
      </Button>
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
        >
          Çocuğunuzun Gelişimi Güvende
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#2563eb] text-white"
        >
          <Activity className="h-8 w-8" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-4 text-sm font-semibold text-[#2563eb]"
        >
          YİSA-S
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-2 text-sm text-gray-600"
        >
          Yapay Zeka Destekli Spor Okulu Yönetim Sistemi
        </motion.p>
      </div>
    </motion.div>
  )
}
