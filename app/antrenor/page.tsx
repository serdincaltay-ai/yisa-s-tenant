"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Calendar,
  HeartPulse,
  Bell,
  LogOut,
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  ClipboardList,
  Activity,
} from "lucide-react"

const bugunOgrenciler = [
  { id: 1, ad: "Elif Yilmaz", yas: 8, durum: "geldi", saglik: "normal", guncelGorev: "On takla calismasi" },
  { id: 2, ad: "Ahmet Kaya", yas: 10, durum: "geldi", saglik: "dikkat", guncelGorev: "Kuvvet egzersizleri" },
  { id: 3, ad: "Zeynep Demir", yas: 7, durum: "bekleniyor", saglik: "normal", guncelGorev: "Esneklik calismasi" },
  { id: 4, ad: "Mehmet Can", yas: 9, durum: "bekleniyor", saglik: "uyari", guncelGorev: "Hafif antrenman" },
]

const bugunProgram = [
  { saat: "14:00", ders: "Temel Cimnastik (Grup A)", ogrenciSayisi: 8, durum: "aktif" },
  { saat: "15:30", ders: "Temel Cimnastik (Grup B)", ogrenciSayisi: 6, durum: "bekliyor" },
  { saat: "17:00", ders: "Ozel Ders - Elif", ogrenciSayisi: 1, durum: "bekliyor" },
]

export default function AntrenorPaneli() {
  const [aktifDers] = useState(bugunProgram[0])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-foreground">YISA-S</span>
              <p className="text-xs text-muted-foreground">Antrenor Paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="relative bg-transparent">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">2</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.location.href = "/"}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="rounded-lg bg-primary p-4 text-primary-foreground">
          <p className="text-sm opacity-80">Hosgeldiniz</p>
          <h1 className="text-xl font-bold">Ali Hoca</h1>
          <p className="text-sm opacity-80">Bugun 3 ders, 15 ogrenci</p>
        </div>

        <Card className="border-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-green-500">Aktif Ders</Badge>
              <span className="text-sm text-muted-foreground">{aktifDers.saat}</span>
            </div>
            <CardTitle className="text-lg">{aktifDers.ders}</CardTitle>
            <CardDescription>{aktifDers.ogrenciSayisi} ogrenci</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                Yoklama Al
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <ClipboardList className="mr-2 h-4 w-4" />
                Ders Notu
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Bugunki Ogrenciler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bugunOgrenciler.map((ogrenci) => (
              <div key={ogrenci.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                    ogrenci.durum === "geldi" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {ogrenci.ad.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium">{ogrenci.ad}</p>
                    <p className="text-xs text-muted-foreground">{ogrenci.guncelGorev}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ogrenci.saglik === "uyari" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {ogrenci.saglik === "dikkat" && <HeartPulse className="h-4 w-4 text-blue-500" />}
                  {ogrenci.durum === "geldi" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-primary" />
              Gunun Programi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bugunProgram.map((ders, i) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-lg p-3 ${
                  ders.durum === "aktif" ? "bg-primary/10 border border-primary" : "bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{ders.saat}</span>
                  <div>
                    <p className="font-medium">{ders.ders}</p>
                    <p className="text-xs text-muted-foreground">{ders.ogrenciSayisi} ogrenci</p>
                  </div>
                </div>
                {ders.durum === "aktif" && <Badge>Aktif</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-primary" />
              Hatirlatmalar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Mehmet Can - Saglik Uyarisi</p>
                <p className="text-sm">Hafif antrenman oneriliyor, yogun calisma yapilmamali.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <HeartPulse className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Ahmet Kaya - Dikkat</p>
                <p className="text-sm">Kuvvet egzersizlerinde bacak calismasi azaltilmali.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
