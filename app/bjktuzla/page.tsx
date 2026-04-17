import Image from 'next/image'

const TENANT = 'bjktuzlacimnastik'
const IMG = (name: string) => `/tenants/${TENANT}/${name}`

const GALLERY = [
  { src: 'cocuk-grup.png',     alt: 'Çocuk grubu antrenmanda' },
  { src: 'barfiks-cocuk.png',  alt: 'Barfikste çocuk sporcu' },
  { src: 'ip-atlama.png',      alt: 'İp atlama egzersizi' },
  { src: 'salon-ic.png',       alt: 'Salon iç görünümü' },
  { src: 'anneyle-baslar.png', alt: 'Anneyle başlar — ilk adım' },
  { src: 'giris-anne-kiz.png', alt: 'Salon girişinde anne ve kız' },
]

export default function BJKTuzlaPage() {
  return (
    <main className="bg-slate-950 text-slate-100">
      {/* HERO */}
      <section className="relative min-h-[90vh] overflow-hidden">
        <Image
          src={IMG('grup-fotograf.png')}
          alt="BJK Tuzla Cimnastik Okulu grup fotoğrafı"
          fill
          priority
          className="object-cover opacity-50"
        />
        <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
          <span className="rounded-full border border-amber-300/60 bg-amber-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-amber-200">
            BJK Tuzla Cimnastik Okulu
          </span>
          <h1 className="mt-6 text-5xl font-bold leading-tight md:text-7xl">
            Çocuğunuzun{' '}
            <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              ilk adımı
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-200 md:text-xl">
            Profesyonel antrenör kadrosu, 900 alanlı YİSA-S ölçüm sistemi ve
            saniyesinde veliye ulaşan şeffaf raporlar.
          </p>
          <a
            href="#kayit"
            className="mt-10 rounded-2xl bg-amber-400 px-8 py-4 text-base font-bold text-slate-950 shadow-2xl shadow-amber-500/30 transition hover:bg-amber-300"
          >
            İlk Ders Ücretsiz — Randevu Al
          </a>
        </div>
      </section>

      {/* GALERİ */}
      <section className="bg-slate-950 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-bold md:text-4xl">Sahadan Görüntüler</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GALLERY.map((g) => (
              <div key={g.src} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-800">
                <Image
                  src={IMG(g.src)}
                  alt={g.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VİDEO — ÖLÇÜM ANI */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ölçüm Anı</h2>
          <p className="mt-3 text-slate-300">YİSA-S sahada nasıl çalışır, izleyin.</p>
          <div className="mt-10 overflow-hidden rounded-3xl border border-slate-800 shadow-2xl">
            <video
              src={IMG('tanitim-paketi.mp4')}
              poster={IMG('salon-ic.png')}
              controls
              playsInline
              className="aspect-video w-full bg-black"
            />
          </div>
        </div>
      </section>

      {/* İLETİŞİM + KAYIT */}
      <section id="kayit" className="bg-slate-950 px-6 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-slate-800">
            <Image src={IMG('kayit-acildi.png')} alt="Kayıtlar açıldı" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold md:text-5xl">Kayıtlar Açıldı</h2>
            <p className="text-lg text-slate-300">
              Tuzla salonumuzda yeni dönem kontenjanı sınırlı. İlk dersinizi ücretsiz
              alın, sonrasında karar verin.
            </p>
            <div className="space-y-3 pt-4">
              <a
                href="tel:+905307104624"
                className="flex items-center gap-3 rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-6 py-4 text-lg font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
              >
                📞 0530 710 46 24
              </a>
              <a
                href="https://wa.me/905307104624"
                className="flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-6 py-4 text-lg font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
              >
                💬 WhatsApp ile yaz
              </a>
              <a
                href="mailto:bjktuzla@yisa-s.com"
                className="flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-300/10 px-6 py-4 text-lg font-semibold text-amber-200 transition hover:bg-amber-300/20"
              >
                ✉️ bjktuzla@yisa-s.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gradient-to-br from-amber-500 via-emerald-500 to-cyan-500 px-6 py-20 text-slate-950">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold md:text-6xl">İlk Ders Ücretsiz</h2>
          <p className="mt-4 text-lg font-medium">
            Çocuğunuzun potansiyelini birlikte ölçelim.
          </p>
          <a
            href="tel:+905307104624"
            className="mt-8 inline-block rounded-2xl bg-slate-950 px-10 py-5 text-xl font-bold text-amber-300 shadow-2xl transition hover:bg-slate-900"
          >
            📞 Hemen Ara — 0530 710 46 24
          </a>
        </div>
      </section>
    </main>
  )
}
