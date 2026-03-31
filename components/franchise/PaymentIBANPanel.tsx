"use client"

/**
 * Franchise tesis sayfası — Paket satın alma + IBAN gösterimi.
 * Kaynak: v0-web-page-content-edit-bjktesis (BJK Tuzla).
 * Hesap adı/IBAN tenant ayarından veya prop ile verilebilir.
 */

import { useState } from "react"
import { Copy, CheckCircle, AlertCircle } from "lucide-react"

export type PackageItem = { id: number; name: string; hours: number; price: number; perSession: number }

export type IBANInfo = {
  bankName: string
  accountName: string
  iban: string
  swift: string
}

const DEFAULT_PACKAGES: PackageItem[] = [
  { id: 1, name: "30 Saatlik Paket", hours: 30, price: 25000, perSession: 833 },
  { id: 2, name: "60 Saatlik Paket", hours: 60, price: 48000, perSession: 800 },
  { id: 3, name: "90 Saatlik Paket", hours: 90, price: 69000, perSession: 767 },
]

const DEFAULT_IBAN: IBANInfo = {
  bankName: "Türkiye İş Bankası",
  accountName: "BJK Tuzla Cimnastik Okulu",
  iban: "TR33 0006 4000 0011 2345 6789 01",
  swift: "ISBKTRISXXX",
}

interface PaymentIBANPanelProps {
  packages?: PackageItem[]
  ibanInfo?: IBANInfo
  whatsappNumber?: string
}

export function PaymentIBANPanel({ packages = DEFAULT_PACKAGES, ibanInfo = DEFAULT_IBAN, whatsappNumber = "0555 123 45 67" }: PaymentIBANPanelProps) {
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null)
  const [showIBAN, setShowIBAN] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Paket Satın Alma</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            onClick={() => {
              setSelectedPackage(pkg)
              setShowIBAN(true)
            }}
            className={`cursor-pointer rounded-2xl border-2 p-6 transition-all ${
              selectedPackage?.id === pkg.id
                ? "border-red-500 bg-red-500/20"
                : "border-white/20 bg-white/10 hover:border-white/40"
            }`}
          >
            <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
            <p className="text-3xl font-bold text-red-400 mb-4">₺{pkg.price.toLocaleString()}</p>
            <div className="space-y-2 text-sm text-gray-300">
              <p>✓ {pkg.hours} saatlik ders hakkı</p>
              <p>✓ Ders başına ₺{pkg.perSession}</p>
              <p>✓ 6 ay geçerli</p>
              <p>✓ Transfer edilebilir</p>
            </div>
          </div>
        ))}
      </div>

      {showIBAN && selectedPackage && (
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-2xl border border-blue-500/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Ödeme Bilgileri</h3>
          </div>

          <p className="text-gray-300 mb-6">
            <span className="font-semibold text-white">{selectedPackage.name}</span> için{" "}
            <span className="font-bold text-red-400">₺{selectedPackage.price.toLocaleString()}</span> tutarını aşağıdaki
            hesaba yatırabilirsiniz:
          </p>

          <div className="space-y-4 bg-black/40 rounded-xl p-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Banka Adı</p>
              <p className="text-white font-semibold">{ibanInfo.bankName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Hesap Adı</p>
              <p className="text-white font-semibold">{ibanInfo.accountName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">IBAN</p>
              <div className="flex items-center gap-2">
                <p className="text-white font-mono text-lg">{ibanInfo.iban}</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ibanInfo.iban)}
                  className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">SWIFT/BIC</p>
              <p className="text-white font-semibold">{ibanInfo.swift}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
            <p className="text-white font-semibold mb-2">Önemli Notlar:</p>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• Ödeme açıklamasına lütfen telefon numaranızı yazınız</li>
              <li>• Ödeme dekontunu WhatsApp&apos;tan paylaşınız: {whatsappNumber}</li>
              <li>• Onay sonrası paketiniz 24 saat içinde aktif edilecektir</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
