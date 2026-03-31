'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MoreHorizontal, Phone, Mail } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function FranchisePartners() {
  const [partners] = useState([
    {
      id: 1,
      name: 'Merve Görmezler',
      company: 'Beşiktaş Tuzla Cimnastik',
      status: 'active',
      projects: 5,
      phone: '+90 532 123 4567',
      email: 'merve@yisa-s.com',
    },
    {
      id: 2,
      name: 'Emre Han Dalgıç',
      company: 'YISA-S Pilot Tesis',
      status: 'active',
      projects: 2,
      phone: '+90 533 987 6543',
      email: 'emre@yisa-s.com',
    },
    {
      id: 3,
      name: 'Özlem Kuşkan',
      company: 'YISA-S Franchise',
      status: 'pending',
      projects: 1,
      phone: '+90 534 456 7890',
      email: 'ozlem@yisa-s.com',
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default:
        return 'bg-gray-700 text-gray-400 border-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif'
      case 'pending':
        return 'Beklemede'
      default:
        return 'Bilinmiyor'
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold">Franchise Ortakları</h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Ortaklarınızı ve projelerini yönetin</p>
        <div className="flex justify-end mt-2">
          <Button size="sm" asChild className="bg-pink-500/20 hover:bg-pink-500/30 text-white border-0">
            <Link href="/dashboard/franchises">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Ortak
            </Link>
          </Button>
        </div>
      </div>
      <div className="space-y-4">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="font-medium text-white">{partner.name}</h3>
                    <p className="text-sm text-gray-400">
                      {partner.company}
                    </p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(partner.status)}>
                    {getStatusText(partner.status)}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-400">
                  <span>{partner.projects} proje</span>
                  <span className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {partner.phone}
                  </span>
                  <span className="flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {partner.email}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/franchises/${partner.id}`}>
                      Detayları Görüntüle
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Düzenle</DropdownMenuItem>
                  <DropdownMenuItem>Anlaşma Yenile</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Ortaklığı Sonlandır
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
    </div>
  )
}
