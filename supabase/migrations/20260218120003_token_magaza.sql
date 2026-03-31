-- Token mağazası: tenants.token_balance, tenant_purchases token kolonları

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0;

-- tenant_purchases token tabanlı satın alma için (mevcut amount TL için kalır)
ALTER TABLE tenant_purchases ADD COLUMN IF NOT EXISTS item_type TEXT;
ALTER TABLE tenant_purchases ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE tenant_purchases ADD COLUMN IF NOT EXISTS token_cost INTEGER;
