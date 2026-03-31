"use client"

import React, { useEffect, useCallback } from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  Building2,
  Users,
  Dumbbell,
  TrendingUp,
  Bell,
  Settings,
  LogOut,
  Search,
  Plus,
  CheckCircle2,
  CheckSquare,
  Clock,
  AlertCircle,
  BarChart3,
  Coins,
  Bot,
  ShoppingBag,
  ShoppingCart,
  Calendar,
  CalendarDays,
  FileText,
  Heart,
  Brain,
  ChevronRight,
  Eye,
  Star,
  Megaphone,
  Package,
  Sparkles,
  UserPlus,
  Wallet,
  Loader2,
  ClipboardCheck,
  CreditCard,
  Store,
  Archive,
  Repeat,
  MapPin,
  Banknote,
  Share2,
  Trophy,
  Gamepad2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { FranchiseIntro } from "@/components/FranchiseIntro"
import { BRANS_RENK, DEFAULT_BRANS_RENK } from "@/lib/tenant-template-config"
import { CollapsibleSidebar, SidebarMainContent, useSidebarClose } from "@/components/CollapsibleSidebar"
import { DersDetayModal } from "@/components/franchise/DersDetayModal"
import { SonGecislerWidget } from "@/components/franchise/SonGecislerWidget"
import { HizliKayitModal } from "@/components/franchise/HizliKayitModal"
import { BranchSelector } from "@/components/BranchSelector"
import { useBranch } from "@/lib/context/branch-context"

type Athlete = { id: string; name: string; surname?: string | null; birth_date?: string | null; gender?: string | null; branch?: string | null; level?: string | null; status?: string; created_at?: string; parent_email?: string | null; trainer_id?: string | null }
type StaffMember = {
  id: string; name: string; surname?: string | null; email?: string | null; phone?: string | null; role?: string; branch?: string | null; is_active?: boolean; created_at?: string;
  birth_date?: string | null; address?: string | null; city?: string | null; district?: string | null; previous_work?: string | null; chronic_condition?: string | null; has_driving_license?: boolean | null; languages?: string | null;
}
type TenantInfo = { id: string; name: string; slug?: string; status?: string; packageType?: string; tokenBalance?: number; franchise?: { businessName?: string; contactName?: string; memberCount?: number; staffCount?: number; monthlyRevenue?: number } }

const mockStudents = [
  { id: 1, name: "Elif Yilmaz", age: 8, branch: "Artistik Cimnastik", level: "Baslangic", health: "normal", tokens: 45 },
  { id: 2, name: "Ahmet Demir", age: 10, branch: "Trampolin", level: "Orta", health: "attention", tokens: 72 },
  { id: 3, name: "Zeynep Kaya", age: 7, branch: "Ritmik Cimnastik", level: "Baslangic", health: "normal", tokens: 38 },
  { id: 4, name: "Can Ozturk", age: 12, branch: "Artistik Cimnastik", level: "Ileri", health: "normal", tokens: 125 },
]

const mockTrainers = [
  { id: 1, name: "Mehmet Yildiz", specialty: "Artistik Cimnastik", students: 28, rating: 4.8 },
  { id: 2, name: "Ayse Celik", specialty: "Ritmik Cimnastik", students: 22, rating: 4.9 },
  { id: 3, name: "Ali Korkmaz", specialty: "Trampolin", students: 18, rating: 4.7 },
]

const mockCOOProducts = [
  { id: 1, name: "Sosyal Medya Robotu", description: "Otomatik paylasim ve cevaplama", price: 500, category: "robot" },
  { id: 2, name: "WhatsApp Robotu", description: "Veli iletisimi otomasyonu", price: 750, category: "robot" },
  { id: 3, name: "Strateji Robotu", description: "Is gelistirme onerileri", price: 1000, category: "robot" },
  { id: 4, name: "Web Sitesi Sablonu", description: "Hazir tesis web sitesi", price: 300, category: "template" },
  { id: 5, name: "Logo Paketi", description: "Profesyonel logo tasarimi", price: 200, category: "template" },
  { id: 6, name: "Online Magaza", description: "Spor urunleri satisi", price: 1500, category: "module" },
]

export default function FranchiseDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [borcluCount, setBorcluCount] = useState(0)
  const [todayDersCount, setTodayDersCount] = useState(0)
  const [pendingOnayCount, setPendingOnayCount] = useState(0)
  const [hizliKayitOpen, setHizliKayitOpen] = useState(false)
  const [hizliKayitToast, setHizliKayitToast] = useState<{ message: string; type: 'success' } | null>(null)
  const [loading, setLoading] = useState(true)
  const { selectedBranchId } = useBranch()

  const fetchTenant = useCallback(async () => {
    const res = await fetch("/api/franchise/tenant")
    const data = await res.json()
    if (data.tenant) setTenant(data.tenant)
  }, [])

  const fetchAthletes = useCallback(async () => {
    const params = new URLSearchParams()
    if (selectedBranchId) params.set('branch_id', selectedBranchId)
    const res = await fetch(`/api/franchise/athletes${params.toString() ? '?' + params.toString() : ''}`)
    const data = await res.json()
    setAthletes(Array.isArray(data.items) ? data.items : [])
  }, [selectedBranchId])

  const fetchStaff = useCallback(async () => {
    const params = new URLSearchParams()
    if (selectedBranchId) params.set('branch_id', selectedBranchId)
    const res = await fetch(`/api/franchise/staff${params.toString() ? '?' + params.toString() : ''}`)
    const data = await res.json()
    setStaff(Array.isArray(data.items) ? data.items : [])
  }, [selectedBranchId])

  const fetchBorcluCount = useCallback(async () => {
    try {
      const res = await fetch("/api/franchise/borclu-hesaplar")
      const data = await res.json()
      setBorcluCount(Array.isArray(data?.sporcular) ? data.sporcular.length : 0)
    } catch {
      setBorcluCount(0)
    }
  }, [])

  const fetchTodayDersCount = useCallback(async () => {
    try {
      const res = await fetch("/api/franchise/schedule")
      const data = await res.json() as { items?: Array<{ gun: string }> }
      const items = Array.isArray(data?.items) ? data.items : []
      const GUN_TR: Record<number, string> = { 0: "Pazar", 1: "Pazartesi", 2: "Sali", 3: "Carsamba", 4: "Persembe", 5: "Cuma", 6: "Cumartesi" }
      const today = GUN_TR[new Date().getDay()] ?? "Pazar"
      const count = items.filter((row) => row.gun === today).length
      setTodayDersCount(count)
    } catch {
      setTodayDersCount(0)
    }
  }, [])

  const fetchPendingOnayCount = useCallback(async () => {
    try {
      const res = await fetch("/api/franchise/onaylar?durum=bekliyor")
      const data = await res.json() as { bekleyen?: number; items?: unknown[] }
      setPendingOnayCount(typeof data?.bekleyen === 'number' ? data.bekleyen : (Array.isArray(data?.items) ? data.items.length : 0))
    } catch {
      setPendingOnayCount(0)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchTenant(), fetchAthletes(), fetchStaff(), fetchBorcluCount(), fetchTodayDersCount(), fetchPendingOnayCount()]).finally(() => setLoading(false))
  }, [fetchTenant, fetchAthletes, fetchStaff, fetchBorcluCount, fetchTodayDersCount, fetchPendingOnayCount])

  useEffect(() => {
    if (!hizliKayitToast) return
    const t = setTimeout(() => setHizliKayitToast(null), 4000)
    return () => clearTimeout(t)
  }, [hizliKayitToast])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <FranchiseIntro tesisAdi={tenant?.name ?? "Demo Tesis"} sahipAdi={tenant?.franchise?.contactName ?? "Sayın Yönetici"} />
      <CollapsibleSidebar>
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">YISA-S</h1>
            <p className="text-xs text-sidebar-foreground/60">Franchise Paneli</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <SidebarItem icon={BarChart3} label="Genel Bakis" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <SidebarItem icon={Users} label="Öğrenciler" active={activeTab === "students"} onClick={() => router.push("/franchise/ogrenci-yonetimi")} />
          <SidebarItem icon={Dumbbell} label="Antrenörler" active={activeTab === "trainers"} onClick={() => setActiveTab("trainers")} />
          <SidebarItem icon={Calendar} label="Ders Programi" active={activeTab === "schedule"} onClick={() => setActiveTab("schedule")} />
          <SidebarItem icon={CalendarDays} label="Takvim" active={false} onClick={() => router.push("/franchise/takvim")} badge={todayDersCount > 0 ? todayDersCount : undefined} />
          <SidebarItem icon={Repeat} label="Rutin Dersler" active={false} onClick={() => router.push("/franchise/rutin-dersler")} />
          <SidebarItem icon={Wallet} label="Ödemeler" active={activeTab === "aidat"} onClick={() => router.push("/franchise/aidatlar")} />
          <SidebarItem icon={CreditCard} label="Borçlu Hesaplar" active={false} onClick={() => router.push("/franchise/borclu-hesaplar")} badge={borcluCount > 0 ? borcluCount : undefined} badgeVariant="destructive" />
          <SidebarItem icon={Coins} label="Kredi Durumu" active={false} onClick={() => router.push("/franchise/kredi-durum")} />
          <SidebarItem icon={Package} label="Paket Dağılımı" active={false} onClick={() => router.push("/franchise/paket-dagilim")} />
          <SidebarItem icon={ClipboardCheck} label="Yoklama" active={activeTab === "yoklama"} onClick={() => router.push("/franchise/yoklama")} />
          <SidebarItem icon={Heart} label="Sağlık Takibi" active={activeTab === "health"} onClick={() => setActiveTab("health")} />
          <SidebarItem icon={Megaphone} label="İletişim" active={activeTab === "iletisim"} onClick={() => router.push("/franchise/iletisim")} />
          <SidebarItem icon={FileText} label="Belgeler" active={activeTab === "belgeler"} onClick={() => router.push("/franchise/belgeler")} />
          <SidebarItem icon={ShoppingBag} label="COO Magazasi" active={activeTab === "coo"} onClick={() => setActiveTab("coo")} badge="Yeni" />
          <SidebarItem icon={Megaphone} label="Pazarlama" active={activeTab === "marketing"} onClick={() => setActiveTab("marketing")} />
          <SidebarItem icon={UserPlus} label="Personel (IK)" active={activeTab === "personel"} onClick={() => router.push("/franchise/personel")} />
          <SidebarItem icon={CheckSquare} label="Onaylar" active={false} onClick={() => router.push("/franchise/onaylar")} badge={pendingOnayCount > 0 ? pendingOnayCount : undefined} badgeVariant="destructive" />
          <SidebarItem icon={Banknote} label="Avans talepleri" active={false} onClick={() => router.push("/franchise/avans")} />
          <SidebarItem icon={Share2} label="Sosyal medya akışı" active={false} onClick={() => router.push("/franchise/sosyal-medya")} />
          <SidebarItem icon={Trophy} label="Puan defteri" active={false} onClick={() => router.push("/franchise/puanlar")} />
          <SidebarItem icon={MapPin} label="Bölge / kulüpler" active={false} onClick={() => router.push("/franchise/bolge")} />
          <SidebarItem icon={FileText} label="Analiz & Raporlar" active={false} onClick={() => router.push("/franchise/analiz")} />
          <SidebarItem icon={Store} label="Market" active={false} onClick={() => router.push("/franchise/market")} />
          <SidebarItem icon={Archive} label="Dolaplar" active={false} onClick={() => router.push("/franchise/dolaplar")} />
          <SidebarItem icon={Gamepad2} label="Oyun saati" active={false} onClick={() => router.push("/franchise/oyun-saati")} />
          <SidebarItem icon={Building2} label="Şubeler" active={false} onClick={() => router.push("/franchise/subeler")} />
          <SidebarItem icon={Dumbbell} label="Branşlar" active={false} onClick={() => router.push("/franchise/branslar")} />
          <SidebarItem icon={ShoppingCart} label="Magaza" active={activeTab === "magaza"} onClick={() => router.push("/magaza")} />
          <SidebarItem icon={Settings} label="Ayarlar" active={activeTab === "settings"} onClick={() => router.push("/franchise/ayarlar")} />
        </nav>

        <div className="border-t border-sidebar-border p-4 space-y-2">
          <p className="text-[10px] text-sidebar-foreground/50 px-1">
            💡 Bu uygulamayı <strong>ana ekrana ekleyin</strong> — menüden &quot;Uygulamayı yükle&quot; / &quot;Ana ekrana ekle&quot;
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
              <Building2 className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">{tenant?.name ?? "Tesisim"}</p>
              <p className="text-xs text-sidebar-foreground/60">Franchise</p>
            </div>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CollapsibleSidebar>

      <SidebarMainContent>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[hsl(var(--border))] bg-card px-6">
          <div className="flex items-center gap-4">
            <BranchSelector />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Ogrenci, antrenor ara..." className="w-64 pl-9" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="relative bg-transparent">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
            </Button>
            <Button variant="outline" className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10" onClick={() => setHizliKayitOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Hızlı Kayıt
            </Button>
            <Button onClick={() => router.push("/franchise/ogrenci-yonetimi")}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Ogrenci
            </Button>
          </div>
        </header>
        <HizliKayitModal
          open={hizliKayitOpen}
          onOpenChange={setHizliKayitOpen}
          onSuccess={() => {
            setHizliKayitToast({ message: 'Sporcu kaydedildi', type: 'success' })
            fetchAthletes()
          }}
        />
        {hizliKayitToast && (
          <div className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg bg-green-600/90 text-white">
            {hizliKayitToast.message}
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {activeTab === "overview" && <OverviewTab tenant={tenant} athletes={athletes} staff={staff} onRefresh={() => { fetchAthletes(); fetchStaff(); fetchTenant(); }} />}
              {activeTab === "students" && <StudentsTab athletes={athletes} staff={staff} onRefresh={fetchAthletes} hasTenant={!!tenant?.id} />}
              {activeTab === "trainers" && <TrainersTab staff={staff} onRefresh={fetchStaff} />}
              {activeTab === "schedule" && <ScheduleTab staff={staff} hasTenant={!!tenant?.id} />}
              {activeTab === "aidat" && <AidatTab athletes={athletes} hasTenant={!!tenant?.id} />}
              {activeTab === "yoklama" && <YoklamaTab athletes={athletes} hasTenant={!!tenant?.id} />}
              {activeTab === "health" && <HealthTab athletes={athletes} />}
              {activeTab === "coo" && <COOTab products={mockCOOProducts} hasTenant={!!tenant?.id} />}
              {activeTab === "marketing" && <MarketingTab />}
              {activeTab === "personel" && <PersonelTab staff={staff} onRefresh={fetchStaff} hasTenant={!!tenant?.id} />}
              {activeTab === "reports" && <ReportsTab />}
              {activeTab === "settings" && <SettingsTab tenant={tenant} hasTenant={!!tenant?.id} />}
            </>
          )}
        </div>
      </SidebarMainContent>
    </div>
  )
}

function SidebarItem({ icon: Icon, label, active, onClick, badge, badgeVariant = 'default' }: {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
  badge?: string | number
  badgeVariant?: 'default' | 'destructive'
}) {
  const closeSidebar = useSidebarClose()
  return (
    <button
      onClick={() => { onClick(); closeSidebar() }}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1 text-left">{label}</span>
      {badge != null && badge !== '' && (
        <span className={`rounded-full px-2 py-0.5 text-xs ${badgeVariant === 'destructive' ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

function OverviewTab({ tenant, athletes, staff, onRefresh }: { tenant: TenantInfo | null; athletes: Athlete[]; staff: StaffMember[]; onRefresh: () => void }) {
  const router = useRouter()
  const [krediOzet, setKrediOzet] = useState<{
    toplamAktifKredi: number
    bitenKrediler: Array<{ id: string; name: string; surname?: string }>
    bitmekUzere: Array<{ id: string; name: string; surname?: string; ders_kredisi: number }>
    borcluHesaplar: Array<{ id: string; name: string; surname?: string; toplam_borc: number }>
  } | null>(null)
  useEffect(() => {
    fetch("/api/franchise/kredi-ozet?threshold=3").then((r) => r.json()).then(setKrediOzet).catch(() => setKrediOzet(null))
  }, [])
  const memberCount = tenant?.franchise?.memberCount ?? athletes.length
  const noTenant = !tenant?.id
  const staffCount = tenant?.franchise?.staffCount ?? staff.length
  const revenue = tenant?.franchise?.monthlyRevenue ?? 0
  return (
    <div className="space-y-6">
      {noTenant && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Henuz atanmis tesisiniz yok. Demo talebiniz Patron onayindan sonra tesisiniz olusturulacak. Bu arada uye ve personel ekleyebilirsiniz — tenant atandiginda tasinacaktir.
            </p>
          </CardContent>
        </Card>
      )}
      <div>
        <h2 className="text-2xl font-bold text-foreground">{tenant?.name ?? "Tesisim"}</h2>
        <p className="text-muted-foreground">Tesis durumu ve gunluk ozet</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Toplam Ogrenci" value={String(memberCount)} change={`${athletes.length} kayitli`} icon={Users} color="primary" />
        <StatCard title="Aktif Antrenor" value={String(staffCount)} change="Personel" icon={Dumbbell} color="success" />
        <StatCard title="Aylik Gelir" value={revenue > 0 ? `${revenue.toLocaleString("tr-TR")} TL` : "—"} change={revenue > 0 ? "Tahmini" : "Henuz veri yok"} icon={TrendingUp} color="accent" />
        <StatCard title="Token Havuzu" value={String(tenant?.tokenBalance ?? 0)} change="Magaza" icon={Coins} color="info" />
        <StatCard title="Toplam Aktif Kredi" value={String(krediOzet?.toplamAktifKredi ?? 0)} change="Ders hakki" icon={Coins} color="info" />
      </div>
      {krediOzet && krediOzet.bitenKrediler.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kredi Biten Sporcular</CardTitle>
            <CardDescription>Yeni paket alinmasi gerekiyor</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {krediOzet.bitenKrediler.map((b) => (
                <li key={b.id}>{b.name} {b.surname ?? ""}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <Card
        className="cursor-pointer transition-colors border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
        onClick={() => router.push("/franchise/kredi-durum")}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="h-5 w-5" />
            Kredisi Bitmek Üzere (≤3 ders)
            <Badge variant="secondary" className="ml-auto bg-amber-500/20 text-amber-400 border-amber-500/40">
              {krediOzet?.bitmekUzere?.length ?? 0}
            </Badge>
          </CardTitle>
          <CardDescription>Kalan ders hakki azalan sporcular — detay listesi icin tiklayin</CardDescription>
        </CardHeader>
        <CardContent>
          {krediOzet?.bitmekUzere && krediOzet.bitmekUzere.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {krediOzet.bitmekUzere.slice(0, 5).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2">
                  <span>{b.name} {b.surname ?? ""}</span>
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">{b.ders_kredisi} ders</Badge>
                </li>
              ))}
              {krediOzet.bitmekUzere.length > 5 && (
                <li className="text-amber-400/80 text-sm">+{krediOzet.bitmekUzere.length - 5} daha — listeye git</li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Tüm sporcuların kredisi yeterli</p>
          )}
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer transition-colors hover:bg-muted/50"
        onClick={() => router.push("/franchise/borclu-hesaplar")}
      >
        <CardHeader>
          <CardTitle>Borçlu Hesaplar</CardTitle>
          <CardDescription>Bakiye pozitif (ödeme bekleyen) sporcular — detay listesi için tıklayın</CardDescription>
        </CardHeader>
        <CardContent>
          {krediOzet?.borcluHesaplar && krediOzet.borcluHesaplar.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {krediOzet.borcluHesaplar.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2">
                  <span>{b.name} {b.surname ?? ""}</span>
                  <Badge variant="destructive">{Number(b.toplam_borc).toLocaleString("tr-TR")} TL</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Borçlu hesap yok</p>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 w-full md:grid-cols-2">
        <SonGecislerWidget limit={10} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Son Kayitlar</CardTitle>
              <CardDescription>Yeni katilan ogrenciler</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>Yenile</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {athletes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henuz ogrenci kaydi yok. Öğrenciler sekmesinden ekleyebilirsiniz.</p>
              ) : (
                athletes.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {(a.name[0] ?? "") + (a.surname?.[0] ?? "")}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{a.name} {a.surname ?? ""}</p>
                        <p className="text-sm text-muted-foreground">{a.branch ?? "—"}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{a.level ?? "—"}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bugunun Dersleri</CardTitle>
              <CardDescription>31 Ocak 2026</CardDescription>
            </div>
            <Button variant="outline" size="sm">Takvim</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staff.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ders programi icin once personel ekleyin.</p>
              ) : (
                <>
                  <ScheduleItem time="09:00" title="Baslangic Grubu" trainer={staff[0]?.name ?? "—"} students={0} />
                  <ScheduleItem time="11:00" title="Orta Seviye" trainer={staff[1]?.name ?? "—"} students={0} />
                  <ScheduleItem time="14:00" title="Ileri Seviye" trainer={staff[2]?.name ?? "—"} students={0} />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Onerileri</CardTitle>
          </div>
          <CardDescription>CELF sisteminin bu haftaki onerileri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-card p-4">
              <p className="font-medium text-foreground">Reklam Kampanyasi</p>
              <p className="mt-1 text-sm text-muted-foreground">Ocak ayi sonuna kadar %15 indirim kampanyasi baslatmaniz oneriliyor.</p>
              <Button size="sm" className="mt-3">Kampanya Baslat</Button>
            </div>
            <div className="rounded-lg bg-card p-4">
              <p className="font-medium text-foreground">Antrenor Ihtiyaci</p>
              <p className="mt-1 text-sm text-muted-foreground">Ritmik cimnastik grubunda yogunluk artiyor.</p>
              <Button size="sm" variant="outline" className="mt-3 bg-transparent">Detaylar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, change, icon: Icon, color }: {
  title: string
  value: string
  change: string
  icon: React.ElementType
  color: string
}) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600",
    accent: "bg-accent/10 text-accent-foreground",
    info: "bg-blue-500/10 text-blue-600",
  }
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xs text-primary">{change}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ScheduleItem({ time, title, trainer, students }: { time: string; title: string; trainer: string; students: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-14 text-center">
        <p className="font-mono text-sm font-medium text-foreground">{time}</p>
      </div>
      <div className="h-12 w-px bg-border" />
      <div className="flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{trainer} - {students} ogrenci</p>
      </div>
    </div>
  )
}

function StudentsTab({ athletes, staff, onRefresh, hasTenant }: { athletes: Athlete[]; staff: StaffMember[]; onRefresh: () => void; hasTenant: boolean }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ name: "", surname: "", birth_date: "", gender: "", branch: "", level: "", parent_email: "", trainer_id: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [assigningTrainer, setAssigningTrainer] = useState<string | null>(null)
  const [selectedTrainer, setSelectedTrainer] = useState<string>("")
  const trainers = staff.filter(s => s.role === "trainer" || s.role === "manager")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending || !form.name.trim()) return
    setSending(true)
    try {
      const url = editingId ? `/api/franchise/athletes/${editingId}` : "/api/franchise/athletes"
      const method = editingId ? "PATCH" : "POST"
      // Filter out empty strings on PATCH to avoid overwriting existing values with null
      const payload = editingId
        ? Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""))
        : form
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data?.ok) {
        setForm({ name: "", surname: "", birth_date: "", gender: "", branch: "", level: "", parent_email: "", trainer_id: "" })
        setShowForm(false)
        setEditingId(null)
        onRefresh()
      } else {
        alert(data?.error ?? "Kayit basarisiz")
      }
    } catch {
      alert("Baglanti hatasi")
    } finally {
      setSending(false)
    }
  }

  const ageFromBirth = (d: string | null | undefined) => {
    if (!d) return null
    const diff = new Date().getTime() - new Date(d).getTime()
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  }

  const handleEdit = (a: Athlete) => {
    setEditingId(a.id)
    setForm({
      name: a.name ?? "",
      surname: a.surname ?? "",
      birth_date: a.birth_date ?? "",
      gender: a.gender ?? "",
      branch: a.branch ?? "",
      level: a.level ?? "",
      parent_email: a.parent_email ?? "",
      trainer_id: a.trainer_id ?? "",
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ogrenciyi pasife almak istiyor musunuz?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/franchise/athletes/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data?.ok) onRefresh()
      else alert(data?.error ?? "Islem basarisiz")
    } catch {
      alert("Baglanti hatasi")
    } finally {
      setDeleting(null)
    }
  }

  const handleAssignTrainer = async (athleteId: string) => {
    if (!selectedTrainer) return
    try {
      const res = await fetch(`/api/franchise/athletes/${athleteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainer_id: selectedTrainer }),
      })
      const data = await res.json()
      if (data?.ok) {
        setAssigningTrainer(null)
        setSelectedTrainer("")
        onRefresh()
      } else {
        alert(data?.error ?? "Atama basarisiz")
      }
    } catch {
      alert("Baglanti hatasi")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Öğrenciler</h2>
          <p className="text-muted-foreground">Tum ogrencileri goruntule ve yonet</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm({ name: "", surname: "", birth_date: "", gender: "", branch: "", level: "", parent_email: "", trainer_id: "" }); setShowForm(true); }} disabled={!hasTenant} title={!hasTenant ? "Tesis atanmasini bekleyin" : ""}><Plus className="mr-2 h-4 w-4" />Yeni Ogrenci</Button>
      </div>

      {!hasTenant && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Uye eklemek icin once tesis atanmasi gerekiyor. Patron onayindan sonra ekleyebilirsiniz.
          </CardContent>
        </Card>
      )}
      {showForm && hasTenant && (
        <Card>
          <CardHeader>
            <CardTitle>Uye Ekle</CardTitle>
            <CardDescription>Ad, soyad, dogum tarihi, veli bilgisi</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Ad *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ad" required /></div>
                <div><Label>Soyad</Label><Input value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} placeholder="Soyad" /></div>
                <div><Label>Dogum Tarihi</Label><Input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} /></div>
                <div><Label>Cinsiyet</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="">Seciniz</option><option value="E">Erkek</option><option value="K">Kiz</option></select></div>
                <div><Label>Brans</Label><Input value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} placeholder="Orn. Artistik Cimnastik" /></div>
                <div><Label>Seviye</Label><Input value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} placeholder="Orn. Baslangic" /></div>
                <div className="md:col-span-2"><Label>Veli E-posta</Label><Input type="email" value={form.parent_email} onChange={e => setForm({ ...form, parent_email: e.target.value })} placeholder="Veli iletisim" /></div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={sending}>{sending ? "Kaydediliyor…" : "Kaydet"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Iptal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {athletes.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Henuz ogrenci yok. Yukaridan ekleyebilirsiniz.</CardContent></Card>
        ) : (
          athletes.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary">
                      {(a.name[0] ?? "") + (a.surname?.[0] ?? "")}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{a.name} {a.surname ?? ""}</h3>
                      <p className="text-sm text-muted-foreground">{ageFromBirth(a.birth_date) != null ? `${ageFromBirth(a.birth_date)} yas` : ""} — {a.branch ?? "—"}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline">{a.level ?? "—"}</Badge>
                        <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status ?? "active"}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/franchise/ogrenci-yonetimi?id=${a.id}`)}><Eye className="mr-1 h-4 w-4" />Profil</Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(a)}><Star className="mr-1 h-4 w-4" />Duzenle</Button>
                    <Button variant="outline" size="sm" onClick={() => { setAssigningTrainer(a.id); setSelectedTrainer(""); }}><Dumbbell className="mr-1 h-4 w-4" />Egitmen Ata</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(a.id)} disabled={deleting === a.id}>
                      {deleting === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sil"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {assigningTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Egitmen Ata</CardTitle>
              <CardDescription>Ogrenciye bir antrenor atayin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedTrainer}
                onChange={e => setSelectedTrainer(e.target.value)}
              >
                <option value="">Antrenor seciniz</option>
                {trainers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} {t.surname ?? ""} — {t.branch ?? t.role ?? ""}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button onClick={() => handleAssignTrainer(assigningTrainer)} disabled={!selectedTrainer}>Ata</Button>
                <Button variant="outline" onClick={() => { setAssigningTrainer(null); setSelectedTrainer(""); }}>Iptal</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function TrainersTab({ staff, onRefresh }: { staff: StaffMember[]; onRefresh: () => void }) {
  const router = useRouter()
  const trainers = staff.filter(s => s.role === "trainer" || s.role === "manager")
  const [deactivating, setDeactivating] = useState<string | null>(null)

  const handleDeactivate = async (id: string) => {
    if (!confirm("Bu personeli pasife almak istiyor musunuz?")) return
    setDeactivating(id)
    try {
      const res = await fetch(`/api/franchise/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      })
      const data = await res.json()
      if (data?.ok) onRefresh()
      else alert(data?.error ?? "Islem basarisiz")
    } catch {
      alert("Baglanti hatasi")
    } finally {
      setDeactivating(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Antrenörler</h2>
          <p className="text-muted-foreground">Antrenor kadrosu — Personel sekmesinden ekleyin</p>
        </div>
        <Button onClick={() => router.push("/franchise/personel")}><Plus className="mr-2 h-4 w-4" />Personel Ekle</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trainers.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Henuz antrenor yok. Personel (IK) sekmesinden ekleyin.</CardContent></Card>
        ) : (
          trainers.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
                    {(t.name[0] ?? "") + (t.surname?.[0] ?? "")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t.name} {t.surname ?? ""}</h3>
                    <p className="text-sm text-muted-foreground">{t.branch ?? t.role ?? "—"}</p>
                    {t.email && <p className="text-xs text-muted-foreground">{t.email}</p>}
                    {t.phone && <p className="text-xs text-muted-foreground">{t.phone}</p>}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant={t.is_active !== false ? "default" : "secondary"}>
                    {t.is_active !== false ? "Aktif" : "Pasif"}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{t.role}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" size="sm" onClick={() => router.push("/franchise/personel")}>Duzenle</Button>
                  <Button variant="destructive" className="flex-1" size="sm" onClick={() => handleDeactivate(t.id)} disabled={deactivating === t.id}>
                    {deactivating === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pasife Al"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

type ScheduleItem = { id: string; gun: string; saat: string; ders_adi: string; brans?: string | null; seviye?: string | null; antrenor_id?: string | null }

const SCHEDULE_DAYS = ["Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi", "Pazar"]
const SCHEDULE_HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]
const BRANS_LIST = Object.keys(BRANS_RENK)

type CellEdit = { gun: string; saat: string; brans: string; seviye: string; ders_adi: string }

function ScheduleTab({ staff, hasTenant }: { staff: StaffMember[]; hasTenant: boolean }) {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [editMode, setEditMode] = useState(false)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [cellForm, setCellForm] = useState<CellEdit>({ gun: "", saat: "", brans: "", seviye: "", ders_adi: "" })
  const [draft, setDraft] = useState<ScheduleItem[]>([])
  const [saving, setSaving] = useState(false)
  const [detailScheduleId, setDetailScheduleId] = useState<string | null>(null)

  const fetchSchedule = useCallback(async () => {
    if (!hasTenant) return
    const res = await fetch("/api/franchise/schedule")
    const data = await res.json()
    const fetched = Array.isArray(data?.items) ? data.items : []
    setItems(fetched)
    setDraft(fetched)
  }, [hasTenant])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  const getSlot = (list: ScheduleItem[], gun: string, saat: string) => list.find((i) => i.gun === gun && i.saat === saat)
  const cellKey = (gun: string, saat: string) => `${gun}-${saat}`

  const handleCellClick = (gun: string, saat: string) => {
    if (!editMode) return
    const key = cellKey(gun, saat)
    if (editingCell === key) { setEditingCell(null); return }
    const existing = getSlot(draft, gun, saat)
    setCellForm({
      gun,
      saat,
      brans: existing?.brans ?? "",
      seviye: existing?.seviye ?? "",
      ders_adi: existing?.ders_adi ?? "",
    })
    setEditingCell(key)
  }

  const handleCellSave = () => {
    if (!cellForm.brans && !cellForm.ders_adi) {
      setDraft((prev) => prev.filter((i) => !(i.gun === cellForm.gun && i.saat === cellForm.saat)))
    } else {
      setDraft((prev) => {
        const existing = prev.find((i) => i.gun === cellForm.gun && i.saat === cellForm.saat)
        const filtered = prev.filter((i) => !(i.gun === cellForm.gun && i.saat === cellForm.saat))
        return [
          ...filtered,
          {
            id: existing?.id ?? "",
            gun: cellForm.gun,
            saat: cellForm.saat,
            ders_adi: cellForm.ders_adi || cellForm.brans,
            brans: cellForm.brans || null,
            seviye: cellForm.seviye || null,
            antrenor_id: existing?.antrenor_id ?? null,
          },
        ]
      })
    }
    setEditingCell(null)
  }

  const handleCellClear = () => {
    setDraft((prev) => prev.filter((i) => !(i.gun === cellForm.gun && i.saat === cellForm.saat)))
    setEditingCell(null)
  }

  const handleSaveAll = async () => {
    if (saving) return
    setSaving(true)
    try {
      const payload = draft.map((item) => ({
        gun: item.gun,
        saat: item.saat,
        ders_adi: item.ders_adi,
        brans: item.brans ?? null,
        seviye: item.seviye ?? null,
        antrenor_id: item.antrenor_id ?? null,
      }))
      const res = await fetch("/api/franchise/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      })
      const data = await res.json()
      if (data?.ok) {
        setEditMode(false)
        setEditingCell(null)
        fetchSchedule()
      } else {
        alert(data?.error ?? "Kayıt başarısız")
      }
    } catch {
      alert("İstek gönderilemedi")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditingCell(null)
    setDraft(items)
  }

  const handleEnterEdit = () => {
    setDraft(items)
    setEditMode(true)
  }

  const bransColor = (brans: string | null | undefined) => {
    if (!brans) return DEFAULT_BRANS_RENK
    return BRANS_RENK[brans] ?? DEFAULT_BRANS_RENK
  }

  const displayItems = editMode ? draft : items

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ders Programı</h2>
          <p className="text-muted-foreground">
            {editMode ? "Hücreye tıklayarak ders ekleyin veya düzenleyin" : "Haftalık ders planı"}
          </p>
        </div>
        {hasTenant && (
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>İptal</Button>
                <Button onClick={handleSaveAll} disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kaydediliyor…</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Kaydet</>}
                </Button>
              </>
            ) : (
              <Button onClick={handleEnterEdit}>
                <Calendar className="mr-2 h-4 w-4" />Düzenle
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-4">
          <div className="min-w-[900px]">
            <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${SCHEDULE_DAYS.length}, 1fr)` }}>
              <div className="p-2" />
              {SCHEDULE_DAYS.map((day) => (
                <div key={day} className="rounded-lg bg-muted p-2 text-center font-medium text-foreground text-sm">{day}</div>
              ))}
              {SCHEDULE_HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="flex items-center justify-center p-2 text-sm text-muted-foreground font-mono">{hour}</div>
                  {SCHEDULE_DAYS.map((day) => {
                    const slot = getSlot(displayItems, day, hour)
                    const key = cellKey(day, hour)
                    const isEditing = editingCell === key
                    const colors = bransColor(slot?.brans)

                    if (isEditing) {
                      return (
                        <div key={key} className="rounded-lg border-2 border-primary p-2 text-xs min-h-[80px] flex flex-col gap-1 bg-muted/50">
                          <select
                            className="w-full rounded border border-input bg-background px-1 py-0.5 text-xs"
                            value={cellForm.brans}
                            onChange={(e) => setCellForm({ ...cellForm, brans: e.target.value, ders_adi: e.target.value || cellForm.ders_adi })}
                          >
                            <option value="">Branş seç…</option>
                            {BRANS_LIST.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                          <input
                            className="w-full rounded border border-input bg-background px-1 py-0.5 text-xs"
                            placeholder="Seviye"
                            value={cellForm.seviye}
                            onChange={(e) => setCellForm({ ...cellForm, seviye: e.target.value })}
                          />
                          <input
                            className="w-full rounded border border-input bg-background px-1 py-0.5 text-xs"
                            placeholder="Ders adı"
                            value={cellForm.ders_adi}
                            onChange={(e) => setCellForm({ ...cellForm, ders_adi: e.target.value })}
                          />
                          <div className="flex gap-1 mt-0.5">
                            <button type="button" onClick={handleCellSave} className="flex-1 rounded bg-primary px-1 py-0.5 text-primary-foreground text-[10px] hover:bg-primary/90">Tamam</button>
                            <button type="button" onClick={handleCellClear} className="flex-1 rounded bg-destructive px-1 py-0.5 text-destructive-foreground text-[10px] hover:bg-destructive/90">Temizle</button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={key}
                        onClick={() => handleCellClick(day, hour)}
                        className={`rounded-lg border p-2 text-center text-xs min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                          editMode ? "cursor-pointer hover:border-primary hover:bg-muted/30" : ""
                        } ${slot ? `${colors.bg} ${colors.border}` : "border-[hsl(var(--border))]"}`}
                      >
                        {slot ? (
                          <>
                            <span className={`font-medium truncate w-full ${colors.text}`}>{slot.brans || slot.ders_adi}</span>
                            {slot.seviye && <span className="text-muted-foreground truncate w-full text-[10px]">{slot.seviye}</span>}
                            {slot.ders_adi && slot.brans && slot.ders_adi !== slot.brans && (
                              <span className="text-muted-foreground truncate w-full text-[10px]">{slot.ders_adi}</span>
                            )}
                            {slot.antrenor_id && (() => {
                              const coach = staff.find((s) => s.id === slot.antrenor_id)
                              return coach ? (
                                <span className="text-muted-foreground truncate w-full text-[10px]">{coach.name} {coach.surname ?? ''}</span>
                              ) : null
                            })()}
                            {!editMode && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] mt-0.5 shrink-0"
                                onClick={(e) => { e.stopPropagation(); setDetailScheduleId(slot.id) }}
                              >
                                Detay
                              </Button>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">{editMode ? "+" : "—"}</span>
                        )}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <DersDetayModal
        scheduleId={detailScheduleId}
        open={detailScheduleId !== null}
        onOpenChange={(open) => !open && setDetailScheduleId(null)}
        onSaved={() => {}}
      />
    </div>
  )
}

type PaymentItem = {
  id: string
  athlete_id: string
  athlete_name: string
  amount: number
  payment_type: string
  period_month?: number | null
  period_year?: number | null
  due_date?: string | null
  paid_date?: string | null
  status: string
  payment_method?: string | null
  notes?: string | null
  created_at: string
}

function AidatTab({ athletes, hasTenant }: { athletes: Athlete[]; hasTenant: boolean }) {
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [showForm, setShowForm] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ athlete_id: "", amount: "", payment_type: "aidat", due_date: "", period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() })
  const [bulkForm, setBulkForm] = useState({ amount: "", period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() })

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const url = filter === "all" ? "/api/franchise/payments" : `/api/franchise/payments?status=${filter}`
    const res = await fetch(url)
    const data = await res.json()
    setPayments(Array.isArray(data?.items) ? data.items : [])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.athlete_id || !form.amount || sending || !hasTenant) return
    setSending(true)
    try {
      const res = await fetch("/api/franchise/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athlete_id: form.athlete_id,
          amount: parseFloat(form.amount),
          payment_type: form.payment_type,
          due_date: form.due_date || undefined,
          period_month: form.period_month,
          period_year: form.period_year,
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        setForm({ athlete_id: "", amount: "", payment_type: "aidat", due_date: "", period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() })
        setShowForm(false)
        fetchPayments()
      } else {
        alert(data?.error ?? "Kayit basarisiz")
      }
    } catch {
      alert("Istek gonderilemedi")
    } finally {
      setSending(false)
    }
  }

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkForm.amount || sending || !hasTenant) return
    setSending(true)
    try {
      const res = await fetch("/api/franchise/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true, amount: parseFloat(bulkForm.amount), period_month: bulkForm.period_month, period_year: bulkForm.period_year }),
      })
      const data = await res.json()
      if (data?.ok) {
        setShowBulk(false)
        fetchPayments()
        alert(data?.message ?? "Aidatlar olusturuldu")
      } else {
        alert(data?.error ?? "Islem basarisiz")
      }
    } catch {
      alert("Istek gonderilemedi")
    } finally {
      setSending(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    if (sending) return
    setSending(true)
    try {
      const res = await fetch("/api/franchise/payments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "paid" }) })
      const data = await res.json()
      if (data?.ok) fetchPayments()
      else alert(data?.error ?? "Guncelleme basarisiz")
    } catch {
      alert("Istek gonderilemedi")
    } finally {
      setSending(false)
    }
  }

  const handleStripeCheckout = async (paymentId: string) => {
    setSending(true)
    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_ids: [paymentId] }),
      })
      const data = await res.json()
      if (data?.url) {
        window.open(data.url, "_blank")
      } else {
        alert(data?.error ?? "Stripe checkout olusturulamadi")
      }
    } catch {
      alert("Istek gonderilemedi")
    } finally {
      setSending(false)
    }
  }

  const statusBadge = (s: string) => {
    if (s === "paid") return <Badge className="bg-green-500/20 text-green-600">Odendi</Badge>
    if (s === "overdue") return <Badge className="bg-red-500/20 text-red-600">Gecikmis</Badge>
    if (s === "cancelled") return <Badge variant="secondary">Iptal</Badge>
    return <Badge className="bg-amber-500/20 text-amber-600">Bekliyor</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Aidat Takibi</h2>
          <p className="text-muted-foreground">Uye aidatlari ve odeme gecmisi</p>
        </div>
        {hasTenant && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowBulk(!showBulk)}>Toplu Aidat Olustur</Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" />Yeni Odeme</Button>
          </div>
        )}
      </div>

      {showBulk && hasTenant && (
        <Card>
          <CardHeader><CardTitle>Toplu Aidat Olustur</CardTitle>
            <CardDescription>Aktif tum uyeler icin secilen ay/yil aidati</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleBulkCreate} className="flex flex-wrap gap-4 items-end">
              <div><Label>Tutar (TL)</Label><Input type="number" step="0.01" min="0" value={bulkForm.amount} onChange={(e) => setBulkForm((f) => ({ ...f, amount: e.target.value }))} required /></div>
              <div><Label>Ay</Label><Input type="number" min="1" max="12" value={bulkForm.period_month} onChange={(e) => setBulkForm((f) => ({ ...f, period_month: parseInt(e.target.value, 10) }))} /></div>
              <div><Label>Yil</Label><Input type="number" min="2020" max="2030" value={bulkForm.period_year} onChange={(e) => setBulkForm((f) => ({ ...f, period_year: parseInt(e.target.value, 10) }))} /></div>
              <Button type="submit" disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Olustur"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {showForm && hasTenant && (
        <Card>
          <CardHeader><CardTitle>Yeni Odeme Ekle</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddPayment} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div><Label>Ogrenci</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" value={form.athlete_id} onChange={(e) => setForm((f) => ({ ...f, athlete_id: e.target.value }))} required>
                  <option value="">Secin</option>
                  {athletes.map((a) => <option key={a.id} value={a.id}>{a.name} {a.surname ?? ""}</option>)}
                </select>
              </div>
              <div><Label>Tutar (TL)</Label><Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required /></div>
              <div><Label>Donem (Ay/Yil)</Label><div className="flex gap-2"><Input type="number" min="1" max="12" placeholder="Ay" value={form.period_month} onChange={(e) => setForm((f) => ({ ...f, period_month: parseInt(e.target.value, 10) }))} /><Input type="number" min="2020" max="2030" placeholder="Yil" value={form.period_year} onChange={(e) => setForm((f) => ({ ...f, period_year: parseInt(e.target.value, 10) }))} /></div></div>
              <div><Label>Son Odeme Tarihi</Label><Input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} /></div>
              <div className="md:col-span-2 flex gap-2"><Button type="submit" disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Iptal</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {(["all", "pending", "paid", "overdue"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "all" ? "Tumu" : f === "pending" ? "Bekleyen" : f === "paid" ? "Odendi" : "Gecikmis"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : payments.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Henuz odeme kaydi yok. Yeni odeme ekleyin veya toplu aidat olusturun.</CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b"><th className="px-4 py-3 text-muted-foreground text-sm">Ogrenci</th><th className="px-4 py-3 text-muted-foreground text-sm">Tutar</th><th className="px-4 py-3 text-muted-foreground text-sm">Donem</th><th className="px-4 py-3 text-muted-foreground text-sm">Durum</th><th className="px-4 py-3 text-muted-foreground text-sm">Islem</th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{p.athlete_name}</td>
                    <td className="px-4 py-3">{p.amount.toLocaleString("tr-TR")} TL</td>
                    <td className="px-4 py-3">{p.period_month}/{p.period_year}</td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3">{p.status === "pending" || p.status === "overdue" ? <div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => handleMarkPaid(p.id)} disabled={sending}>Odendi Yap</Button><Button size="sm" variant="outline" className="border-purple-500/50 text-purple-700 hover:bg-purple-50" onClick={() => handleStripeCheckout(p.id)} disabled={sending}><CreditCard className="h-3 w-3 mr-1" />Online Ode</Button></div> : <span className="text-muted-foreground text-sm">{p.paid_date ? new Date(p.paid_date).toLocaleDateString("tr-TR") : "—"}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function YoklamaTab({ athletes, hasTenant }: { athletes: Athlete[]; hasTenant: boolean }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [records, setRecords] = useState<Record<string, string>>({})
  const [existing, setExisting] = useState<{ athlete_id: string; status: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const fetchAttendance = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/franchise/attendance?date=${date}`)
    const data = await res.json()
    const items = Array.isArray(data?.items) ? data.items : []
    setExisting(items)
    const map: Record<string, string> = {}
    for (const a of athletes) {
      const found = items.find((x: { athlete_id: string }) => x.athlete_id === a.id)
      map[a.id] = found?.status ?? "present"
    }
    setRecords(map)
    setLoading(false)
  }, [date, athletes])

  useEffect(() => {
    if (hasTenant && athletes.length > 0) fetchAttendance()
    else setLoading(false)
  }, [fetchAttendance, hasTenant, athletes.length])

  const handleStatusChange = (athleteId: string, status: string) => {
    setRecords((r) => ({ ...r, [athleteId]: status }))
  }

  const handleSave = async () => {
    if (!hasTenant || sending) return
    setSending(true)
    try {
      const recs = Object.entries(records).map(([athlete_id, status]) => ({ athlete_id, lesson_date: date, status }))
      const res = await fetch("/api/franchise/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: recs }) })
      const data = await res.json()
      if (data?.ok) {
        fetchAttendance()
        alert("Yoklama kaydedildi.")
      } else alert(data?.error ?? "Kayit basarisiz")
    } catch {
      alert("Istek gonderilemedi")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Yoklama</h2>
          <p className="text-muted-foreground">Gunluk yoklama kaydi</p>
        </div>
        {hasTenant && (
          <div className="flex gap-2 items-center">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
            <Button size="sm" onClick={handleSave} disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}</Button>
          </div>
        )}
      </div>
      {!hasTenant ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Tesis atanmamis.</CardContent></Card>
      ) : loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : athletes.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Henuz ogrenci kaydi yok.</CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b"><th className="px-4 py-3 text-muted-foreground text-sm">Ogrenci</th><th className="px-4 py-3 text-muted-foreground text-sm">Durum</th></tr></thead>
              <tbody>
                {athletes.map((a) => (
                  <tr key={a.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{a.name} {a.surname ?? ""}</td>
                    <td className="px-4 py-3">
                      <select className="flex h-9 w-32 rounded-md border border-input bg-background px-2" value={records[a.id] ?? "present"} onChange={(e) => handleStatusChange(a.id, e.target.value)}>
                        <option value="present">Geldi</option>
                        <option value="absent">Gelmedi</option>
                        <option value="late">Gec</option>
                        <option value="excused">Izinli</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function HealthTab({ athletes }: { athletes: Athlete[] }) {
  const active = athletes.filter(a => a.status === "active" || !a.status).length
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Sağlık Takibi</h2>
        <p className="text-muted-foreground">Ogrenci saglik durumu ve risk analizleri</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-foreground">{active}</p>
              <p className="text-sm text-muted-foreground">Aktif Ogrenci</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Dikkat Gerektiren</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-foreground">—</p>
              <p className="text-sm text-muted-foreground">AI Analiz</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function COOTab({ products, hasTenant }: { products: typeof mockCOOProducts; hasTenant: boolean }) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [templates, setTemplates] = useState<{ id: string; template_id?: string; name: string; type: string; source?: string }[]>([])
  const [templateLoading, setTemplateLoading] = useState(false)
  const [usingId, setUsingId] = useState<string | null>(null)
  const [buyingId, setBuyingId] = useState<string | number | null>(null)

  useEffect(() => {
    if (selectedCategory === "template" || selectedCategory === "all") {
      setTemplateLoading(true)
      fetch("/api/templates")
        .then((r) => r.json())
        .then((d) => setTemplates(Array.isArray(d?.coo_templates) ? d.coo_templates : (Array.isArray(d?.templates) ? d.templates : [])))
        .catch(() => setTemplates([]))
        .finally(() => setTemplateLoading(false))
    }
  }, [selectedCategory])

  const handleUseTemplate = async (t: { id: string; template_id?: string; name: string; source?: string }) => {
    const tid = t.template_id ?? t.id.replace(/^ceo-/, "")
    const source = t.source === "ceo" ? "ceo_templates" : "templates"
    if (!tid || !hasTenant) return
    setUsingId(t.id)
    try {
      const res = await fetch("/api/franchise/template-use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: tid, template_source: source }),
      })
      const data = await res.json()
      if (data?.ok) alert("Sablon kullaniminiz kaydedildi.")
      else alert(data?.error ?? "Kayit basarisiz")
    } catch {
      alert("Istek gonderilemedi")
    } finally {
      setUsingId(null)
    }
  }

  const handleBuyProduct = async (product: { id: number; name: string; price: number }) => {
    if (!hasTenant || buyingId !== null) return
    setBuyingId(product.id)
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: product.price,
          aciklama: product.name,
          product_key: `product_${product.id}`,
          para_birimi: "TRY",
        }),
      })
      const data = await res.json()
      if (data?.ok) alert("Satin alindi. Tutar CELF Kasaya kaydedildi.")
      else alert(data?.error ?? "Kayit basarisiz")
    } catch {
      alert("Istek gonderilemedi")
    } finally {
      setBuyingId(null)
    }
  }

  const filteredProducts = selectedCategory === "all" ? products : products.filter(p => p.category === selectedCategory)
  const showTemplates = selectedCategory === "template" || selectedCategory === "all"
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">COO Magazasi</h2>
        <p className="text-muted-foreground">Tesisiniz icin robotlar, sablonlar ve moduller</p>
      </div>
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">Tumu</TabsTrigger>
          <TabsTrigger value="robot">Robotlar</TabsTrigger>
          <TabsTrigger value="template">Sablonlar</TabsTrigger>
          <TabsTrigger value="module">Moduller</TabsTrigger>
        </TabsList>
      </Tabs>
      {showTemplates && templates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Hazir Sablonlar (CEO/CELF)</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {templateLoading ? (
              <p className="text-muted-foreground">Yukleniyor…</p>
            ) : (
              templates.map((t) => (
                <Card key={t.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold text-foreground">{t.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{t.type} · {t.source === "ceo" ? "Robot" : "Veritabani"}</p>
                      <div className="mt-4">
                        <Button
                          size="sm"
                          disabled={!hasTenant || usingId === t.id}
                          onClick={() => handleUseTemplate(t)}
                        >
                          {usingId === t.id ? "Kaydediliyor…" : "Kullan"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
      {(selectedCategory === "all" || selectedCategory === "robot" || selectedCategory === "module") && (
        <div>
          {selectedCategory === "all" && templates.length > 0 && <h3 className="text-lg font-semibold text-foreground mb-4">Urunler (Robot / Modul)</h3>}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.filter((p) => p.category !== "template").map((product) => (
              <Card key={product.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    {product.category === "robot" ? <Bot className="h-6 w-6 text-primary" /> :
                      product.category === "template" ? <Package className="h-6 w-6 text-primary" /> :
                      <Sparkles className="h-6 w-6 text-primary" />}
                  </div>
                  <div className="mt-4">
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-lg font-bold text-primary">{product.price} ₺</p>
                      <Button
                        size="sm"
                        disabled={!hasTenant || buyingId === product.id}
                        onClick={() => handleBuyProduct(product)}
                      >
                        {buyingId === product.id ? "Kaydediliyor…" : "Satin Al"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MarketingTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Pazarlama</h2>
        <p className="text-muted-foreground">Kampanyalar ve sosyal medya yonetimi</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Aktif Kampanyalar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-[hsl(var(--border))] p-4">
            <p className="font-medium text-foreground">Kis Indirimi</p>
            <p className="text-sm text-muted-foreground">%20 indirim - 15 Subat&apos;a kadar</p>
            <Progress value={65} className="mt-3" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ReportsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Raporlar</h2>
        <p className="text-muted-foreground">Tesis performans raporlari</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Detayli raporlar veritabani baglantisi sonrasi aktif olacak.</p>
        </CardContent>
      </Card>
    </div>
  )
}

type PersonelRole = "trainer" | "manager" | "admin" | "receptionist" | "cleaning" | "other"
const personelFormDefaults: {
  name: string; surname: string; email: string; phone: string; role: PersonelRole; branch: string;
  birth_date: string; address: string; city: string; district: string; previous_work: string; chronic_condition: string; has_driving_license: boolean; languages: string;
} = {
  name: "", surname: "", email: "", phone: "", role: "trainer", branch: "",
  birth_date: "", address: "", city: "", district: "", previous_work: "", chronic_condition: "", has_driving_license: false, languages: "",
}

function PersonelTab({ staff, onRefresh, hasTenant }: { staff: StaffMember[]; onRefresh: () => void; hasTenant: boolean }) {
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState(personelFormDefaults)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending || !form.name.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/franchise/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, surname: form.surname || undefined, email: form.email || undefined, phone: form.phone || undefined,
          role: form.role, branch: form.branch || undefined,
          birth_date: form.birth_date || undefined, address: form.address || undefined, city: form.city || undefined, district: form.district || undefined,
          previous_work: form.previous_work || undefined, chronic_condition: form.chronic_condition || undefined,
          has_driving_license: form.has_driving_license, languages: form.languages || undefined,
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        setForm(personelFormDefaults)
        onRefresh()
      } else {
        alert(data?.error ?? "Kayit basarisiz")
      }
    } catch {
      alert("Baglanti hatasi")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Personel (IK)</h2>
        <p className="text-muted-foreground">Antrenor, mudur ekleme — staff tablosuna kaydedilir</p>
      </div>
      {!hasTenant && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Personel eklemek icin once tesis atanmasi gerekiyor.
          </CardContent>
        </Card>
      )}
      {hasTenant && (
        <Card>
        <CardHeader>
          <CardTitle>Personel Ekle</CardTitle>
          <CardDescription>Ad, soyad, iletisim, rol, brans; dogum tarihi, adres, onceki is, saglik, araba, dil bilgileri</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Ad *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ad" required />
              </div>
              <div className="space-y-2">
                <Label>Soyad</Label>
                <Input value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} placeholder="Soyad" />
              </div>
              <div className="space-y-2">
                <Label>Dogum tarihi</Label>
                <Input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} placeholder="YYYY-MM-DD" />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="E-posta" />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Telefon" />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as PersonelRole })}>
                  <option value="trainer">Antrenör</option>
                  <option value="manager">Tesis Muduru</option>
                  <option value="admin">Admin</option>
                  <option value="receptionist">Kayit</option>
                  <option value="cleaning">Temizlik personeli</option>
                  <option value="other">Diger</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Brans</Label>
                <Input value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} placeholder="Orn. Artistik Cimnastik" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Oturdugu yer / Adres</Label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Adres" />
              </div>
              <div className="space-y-2">
                <Label>Il</Label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Il" />
              </div>
              <div className="space-y-2">
                <Label>Ilce</Label>
                <Input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="Ilce" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Daha once calistigi yer</Label>
                <Input value={form.previous_work} onChange={e => setForm({ ...form, previous_work: e.target.value })} placeholder="Is yeri / pozisyon" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Surekli rahatsizlik (varsa)</Label>
                <Input value={form.chronic_condition} onChange={e => setForm({ ...form, chronic_condition: e.target.value })} placeholder="Bos birakilabilir" />
              </div>
              <div className="space-y-2 flex items-center gap-2">
                <input type="checkbox" id="has_driving_license" checked={form.has_driving_license} onChange={e => setForm({ ...form, has_driving_license: e.target.checked })} className="rounded border-input" />
                <Label htmlFor="has_driving_license">Araba kullanabiliyor</Label>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Dil bilgileri</Label>
                <Input value={form.languages} onChange={e => setForm({ ...form, languages: e.target.value })} placeholder="Orn. Turkce, Ingilizce" />
              </div>
            </div>
            <Button type="submit" disabled={sending}>{sending ? "Kaydediliyor…" : "Kaydet"}</Button>
          </form>
        </CardContent>
      </Card>
      )}

      {staff.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kayitli Personel</CardTitle>
            <CardDescription>{staff.length} kisi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {staff.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {(s.name[0] ?? "") + (s.surname?.[0] ?? "")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.name} {s.surname ?? ""}</p>
                    <p className="text-sm text-muted-foreground">{s.role === "cleaning" ? "Temizlik" : s.role} — {s.branch ?? "—"}</p>
                    {(s.city || s.languages) && (
                      <p className="text-xs text-muted-foreground mt-0.5">{[s.city, s.district].filter(Boolean).join(", ")}{s.languages ? ` · ${s.languages}` : ""}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SettingsTab({ tenant, hasTenant }: { tenant: TenantInfo | null; hasTenant: boolean }) {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    antrenor_hedef: 0,
    temizlik_hedef: 0,
    mudur_hedef: 0,
    aidat_25: 500,
    aidat_45: 700,
    aidat_60: 900,
    kredi_paketleri: [] as Array<{ isim: string; saat: number; fiyat: number }>,
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!hasTenant) return
    fetch("/api/franchise/settings")
      .then((r) => r.json())
      .then((d) => {
        const t = d?.tenant
        if (t) {
          const tiers = t.aidat_tiers ?? {}
          const pkts = Array.isArray(t.kredi_paketleri) ? t.kredi_paketleri : []
          setSettings({
            antrenor_hedef: t.antrenor_hedef ?? 0,
            temizlik_hedef: t.temizlik_hedef ?? 0,
            mudur_hedef: t.mudur_hedef ?? 0,
            aidat_25: Number(tiers["25"]) || 500,
            aidat_45: Number(tiers["45"]) || 700,
            aidat_60: Number(tiers["60"]) || 900,
            kredi_paketleri: pkts.map((p: unknown) => ({
              isim: (p as { isim?: string })?.isim ?? "",
              saat: Number((p as { saat?: number })?.saat) || 0,
              fiyat: Number((p as { fiyat?: number })?.fiyat) || 0,
            })),
          })
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [hasTenant])

  const handleSave = async () => {
    if (!hasTenant || saving) return
    setSaving(true)
    try {
      const res = await fetch("/api/franchise/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          antrenor_hedef: settings.antrenor_hedef,
          temizlik_hedef: settings.temizlik_hedef,
          mudur_hedef: settings.mudur_hedef,
          aidat_tiers: { "25": settings.aidat_25, "45": settings.aidat_45, "60": settings.aidat_60 },
          kredi_paketleri: settings.kredi_paketleri,
        }),
      })
      const data = await res.json()
      if (data?.ok) alert("Ayarlar kaydedildi.")
      else alert(data?.error ?? "Kayit basarisiz")
    } catch {
      alert("Istek gonderilemedi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Tesis Ayarlari</h2>
        <p className="text-muted-foreground">Personel hedefleri, aidat kademeleri</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tesis Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tesis Adi</label>
              <Input defaultValue={tenant?.name ?? "Tesisim"} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Paket</label>
              <Input defaultValue={tenant?.packageType ?? "starter"} readOnly className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
      {hasTenant && (
        <Card>
          <CardHeader>
            <CardTitle>Personel Hedefleri</CardTitle>
            <CardDescription>Kac antrenor, temizlik, mudur planliyorsunuz?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Antrenor sayisi</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.antrenor_hedef}
                  onChange={(e) => setSettings((s) => ({ ...s, antrenor_hedef: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Temizlik personeli</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.temizlik_hedef}
                  onChange={(e) => setSettings((s) => ({ ...s, temizlik_hedef: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mudur sayisi</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.mudur_hedef}
                  onChange={(e) => setSettings((s) => ({ ...s, mudur_hedef: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {hasTenant && (
        <Card>
          <CardHeader>
            <CardTitle>Aidat Kademeleri (saat / aylik TL)</CardTitle>
            <CardDescription>25 saat, 45 saat, 60 saat kademelerinde aylik ucret</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>25 saat (TL/ay)</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.aidat_25}
                  onChange={(e) => setSettings((s) => ({ ...s, aidat_25: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>45 saat (TL/ay)</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.aidat_45}
                  onChange={(e) => setSettings((s) => ({ ...s, aidat_45: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>60 saat (TL/ay)</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.aidat_60}
                  onChange={(e) => setSettings((s) => ({ ...s, aidat_60: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving || !loaded}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </CardContent>
        </Card>
      )}
      {hasTenant && (
        <Card>
          <CardHeader>
            <CardTitle>Kredi Paketleri</CardTitle>
            <CardDescription>Veli kredi satin alma icin paketler (isim, ders sayisi, fiyat)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.kredi_paketleri.map((p, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input placeholder="Isim (orn. Hafta 2)" value={p.isim} onChange={(e) => setSettings((s) => ({ ...s, kredi_paketleri: s.kredi_paketleri.map((x, j) => j === i ? { ...x, isim: e.target.value } : x) }))} className="flex-1" />
                <Input type="number" placeholder="Ders" value={p.saat || ""} onChange={(e) => setSettings((s) => ({ ...s, kredi_paketleri: s.kredi_paketleri.map((x, j) => j === i ? { ...x, saat: parseInt(e.target.value, 10) || 0 } : x) }))} className="w-20" />
                <Input type="number" placeholder="Fiyat TL" value={p.fiyat || ""} onChange={(e) => setSettings((s) => ({ ...s, kredi_paketleri: s.kredi_paketleri.map((x, j) => j === i ? { ...x, fiyat: parseInt(e.target.value, 10) || 0 } : x) }))} className="w-24" />
                <Button variant="ghost" size="sm" onClick={() => setSettings((s) => ({ ...s, kredi_paketleri: s.kredi_paketleri.filter((_, j) => j !== i) }))}>Sil</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setSettings((s) => ({ ...s, kredi_paketleri: [...s.kredi_paketleri, { isim: "", saat: 0, fiyat: 0 }] }))}>Paket Ekle</Button>
            <Button onClick={handleSave} disabled={saving || !loaded}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
