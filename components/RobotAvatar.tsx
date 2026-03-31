'use client'

import React from 'react'

type PanelType = 'patron' | 'vitrin' | 'tenant'

interface RobotAvatarProps {
  panelType: PanelType
  tenantName?: string
  /** Compact mode — sadece avatar, balon yok */
  compact?: boolean
}

const MESAJLAR: Record<PanelType, (name?: string) => string> = {
  patron: () => 'Hoş geldin Patron',
  vitrin: () => 'Sayın yatırımcı, YiSA-S ile tanışın',
  tenant: (name) => `Değerli misafirimiz, ${name ?? 'tesisimize'} hoş geldiniz`,
}

/**
 * RobotAvatar — 3 panelde ortak kullanılan robot yüzü bileşeni.
 * Yuvarlak gradient-animasyonlu çerçeve, CSS animasyonlu göz kırpma ve konuşma balonu.
 */
export default function RobotAvatar({ panelType, tenantName, compact }: RobotAvatarProps) {
  const mesaj = MESAJLAR[panelType](tenantName)

  return (
    <div className="robot-avatar-wrapper">
      {/* Yuvarlak Avatar */}
      <div className="robot-avatar-frame">
        <div className="robot-face">
          {/* Gözler */}
          <div className="robot-eyes">
            <div className="robot-eye robot-eye-left">
              <div className="robot-pupil" />
            </div>
            <div className="robot-eye robot-eye-right">
              <div className="robot-pupil" />
            </div>
          </div>
          {/* Ağız */}
          <div className="robot-mouth" />
          {/* Anten */}
          <div className="robot-antenna">
            <div className="robot-antenna-tip" />
          </div>
        </div>
      </div>

      {/* Konuşma Balonu */}
      {!compact && (
        <div className="robot-speech-bubble">
          <p className="robot-speech-text">{mesaj}</p>
          <div className="robot-speech-arrow" />
        </div>
      )}
    </div>
  )
}
