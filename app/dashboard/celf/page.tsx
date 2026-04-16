import Link from 'next/link'

export default function CELFPage() {
  return (
    <div className="p-8">
      <div className="max-w-3xl rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-amber-100">
        <h1 className="text-2xl font-semibold mb-3">CELF tenant kapsamından çıkarıldı</h1>
        <p className="text-sm leading-6 text-amber-50/90">
          Bu ekran, SYSTEM_RULES_SSOT kapsamında patron uygulamasına taşındı.
          CELF işlemleri için <strong>app.yisa-s.com</strong> kullanın.
        </p>
        <div className="mt-5">
          <Link
            href="https://app.yisa-s.com"
            className="inline-flex rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
          >
            Patron Uygulamasına Git
          </Link>
        </div>
      </div>
    </div>
  )
}
