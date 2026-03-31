'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react'

export function ProjectManagement() {
  const [projects] = useState([
    {
      id: 1,
      title: 'Patron Komuta Merkezi Güncellemesi',
      partner: 'Beşiktaş Tuzla Cimnastik',
      status: 'review',
      priority: 'high',
      dueDate: '2025-02-15',
    },
    {
      id: 2,
      title: 'Şablon Sistemi Entegrasyonu',
      partner: 'YISA-S Pilot Tesis',
      status: 'in-progress',
      priority: 'medium',
      dueDate: '2025-02-20',
    },
    {
      id: 3,
      title: 'Veli Paneli İyileştirmesi',
      partner: 'YISA-S Franchise',
      status: 'pending',
      priority: 'low',
      dueDate: '2025-02-25',
    },
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'review':
        return <Eye className="h-4 w-4" />
      case 'in-progress':
        return <Clock className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'review':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'in-progress':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'pending':
        return 'bg-gray-700 text-gray-400 border-gray-600'
      default:
        return 'bg-gray-700 text-gray-400 border-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'review':
        return 'İncelemede'
      case 'in-progress':
        return 'Devam Ediyor'
      case 'pending':
        return 'Beklemede'
      default:
        return 'Bilinmiyor'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-gray-700 text-gray-400 border-gray-600'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek'
      case 'medium':
        return 'Orta'
      case 'low':
        return 'Düşük'
      default:
        return 'Normal'
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2">Proje Yönetimi</h2>
      <p className="text-xs sm:text-sm text-gray-400 mb-4">Devam eden ve bekleyen projeler</p>
      <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-white">{project.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {project.partner}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge
                      variant="outline"
                      className={getStatusColor(project.status)}
                    >
                      {getStatusIcon(project.status)}
                      <span className="ml-1">{getStatusText(project.status)}</span>
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getPriorityColor(project.priority)}
                    >
                      {getPriorityText(project.priority)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Son tarih: {project.dueDate}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
    </div>
  )
}
