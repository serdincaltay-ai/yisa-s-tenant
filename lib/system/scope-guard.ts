import { NextResponse } from 'next/server'

export function tenantScopeGoneResponse(moduleName: string) {
  const res = NextResponse.json(
    {
      ok: false,
      error: `${moduleName} tenant uygulama kapsamından çıkarıldı.`,
      message: 'Bu modülü app.yisa-s.com (patron) uygulamasından kullanın.',
      target: 'https://app.yisa-s.com',
    },
    { status: 410 }
  )
  res.headers.set('X-YISA-Deprecated', 'true')
  res.headers.set('X-YISA-Migrate-To', 'yisa-s-patron')
  res.headers.set('Link', '</docs/MIGRATION_TO_PATRON.md>; rel="deprecation"')
  return res
}
