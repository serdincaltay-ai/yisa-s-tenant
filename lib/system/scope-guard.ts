import { NextResponse } from 'next/server'

export function tenantScopeGoneResponse(moduleName: string) {
  return NextResponse.json(
    {
      ok: false,
      error: `${moduleName} tenant uygulama kapsamından çıkarıldı.`,
      message: 'Bu modülü app.yisa-s.com (patron) uygulamasından kullanın.',
      target: 'https://app.yisa-s.com',
    },
    { status: 410 }
  )
}
