-- demo_requests: Firma sahibi giriş ödemesi (Patron: "Merve ödedi" → nerede görünecek)
-- Tarih: 3 Şubat 2026

ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'bekliyor' CHECK (payment_status IN ('bekliyor', 'odendi', 'iptal'));
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(12,2);
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS payment_at TIMESTAMPTZ;
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS payment_notes TEXT;

COMMENT ON COLUMN demo_requests.payment_status IS 'Firma sahibi giriş ödemesi: bekliyor, odendi, iptal';
COMMENT ON COLUMN demo_requests.payment_amount IS 'Alınan tutar (örn. 1500 USD)';
COMMENT ON COLUMN demo_requests.payment_at IS 'Ödemenin alındığı tarih/saat';
