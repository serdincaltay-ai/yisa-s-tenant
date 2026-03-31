-- ceo_templates: template_name, template_type, content kolonları (SABLONLAR_TEK_SQL için)
ALTER TABLE ceo_templates ADD COLUMN IF NOT EXISTS template_name TEXT;
ALTER TABLE ceo_templates ADD COLUMN IF NOT EXISTS template_type TEXT;
ALTER TABLE ceo_templates ADD COLUMN IF NOT EXISTS content JSONB;
