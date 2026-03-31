'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, ExternalLink } from 'lucide-react'

export default function TesisBelgelerPage() {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Belgeler
        </h1>
        <p className="text-muted-foreground">Belge yonetimi ve gecerlilik takibi</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Belge Yonetimi</CardTitle>
          <CardDescription>
            Sağlık raporu geçerlilik uyarıları, belge yukleme ve veli bildirim islemleri
            franchise panelinden yonetilmektedir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/franchise/belgeler">
              <ExternalLink className="h-4 w-4 mr-2" />
              Franchise Belge Paneline Git
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
