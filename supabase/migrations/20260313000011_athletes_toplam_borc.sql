-- athletes: borç takibi (TL) — kredi özeti borçlu hesaplar için
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS toplam_borc NUMERIC(10,2) DEFAULT 0;
