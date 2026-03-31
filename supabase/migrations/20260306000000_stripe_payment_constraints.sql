-- Stripe ödeme entegrasyonu için CHECK constraint güncellemesi
-- payments tablosuna 'processing' status eklendi (Stripe checkout başlatıldı, webhook bekleniyor)

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'processing'));
