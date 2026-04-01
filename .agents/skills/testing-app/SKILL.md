# YİSA-S Tenant App Testing

## Dev Server Setup

1. **CRITICAL: Unset conflicting env vars before starting dev server:**
   ```bash
   unset NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY
   ```
   Shell environment variables from Devin secrets override `.env.local` values. The Devin secrets may contain truncated or incorrect keys. Always unset them first.

2. **Start dev server on port 3002:**
   ```bash
   PORT=3002 npm run dev
   ```
   Port 3002 avoids conflicts with vitrin (3000) and patron (3001).

3. **Build check:**
   ```bash
   unset NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY
   npx next build
   ```

## Authentication

- **Supabase project:** bgtuqdkfppcjmtrdsldl (eu-central-1)
- **Supabase URL:** ${NEXT_PUBLIC_SUPABASE_URL}
- **Correct keys are in:** `.env.local` (do NOT rely on shell env vars)
- **Phone-based auth:** Demo-approved tenants get auth users with email format `{phone}@demo.yisa-s.com` and password = last 4 digits of phone
- **Test account (Faz 7):** `5399887766@demo.yisa-s.com` / `7766` — owner role, tenant slug `faz7-ui-test`

## Role Resolution Chain

Login role resolution priority (in `lib/auth/resolve-role.ts`):
1. PATRON_EMAIL match → `patron`
2. `kullanicilar.roller.kod` → normalized role
3. `profiles.role` → normalized role
4. `user_tenants.role` → normalized role (owner → franchise)
5. `user_metadata.role` → normalized role
6. Default → `veli`

Role → path mapping in `ROLE_TO_PATH`:
- patron → /dashboard
- franchise/owner → /franchise
- tesis_sahibi → /isletme-muduru
- antrenor → /antrenor
- veli → /veli

## Database

- **Supabase Management API:** Can be used to run SQL against live DB using `SUPABASE_ACCESS_TOKEN` secret
- **Faz 2 tables:** system_templates, tenant_template_slots, tenant_leads, trial_requests, parent_profiles
- **PostgreSQL triggers:** Can silently fail if they reference non-existent columns — check trigger definitions when UPDATE operations fail

## Common Issues

- `/logo.png` warning is cosmetic — not a real error
- First page load after `npm run dev` takes ~10s due to compilation
- The `tenant_leads` table exists but has no API route or UI writing to it yet (planned for Faz 9)
