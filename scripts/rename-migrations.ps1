# Migration dosyalarini benzersiz timestamp ile yeniden adlandir
# Supabase version = dosya adinin timestamp kismi (ilk 14 karakter: YYYYMMDDHHmmss)
$base = "C:\Users\info\OneDrive\Desktop\v0 yisa s dosyamız\yisa-s-app\supabase\migrations"
$renames = @(
  @{old="20260130_ceo_tasks_awaiting_approval.sql"; new="20260130120000_ceo_tasks_awaiting_approval.sql"},
  @{old="20260130_ceo_tasks_idempotency.sql"; new="20260130120001_ceo_tasks_idempotency.sql"},
  @{old="20260131_add_cspo_directorate.sql"; new="20260131120000_add_cspo_directorate.sql"},
  @{old="20260131_cio_analysis_logs.sql"; new="20260131120001_cio_analysis_logs.sql"},
  @{old="20260131_create_robot_tables.sql"; new="20260131120002_create_robot_tables.sql"},
  @{old="20260131_seed_robots_directorates.sql"; new="20260131120003_seed_robots_directorates.sql"},
  @{old="20260202_asama2_tenant_schema.sql"; new="20260202120000_asama2_tenant_schema.sql"},
  @{old="20260202_athletes_parent_email.sql"; new="20260202120001_athletes_parent_email.sql"},
  @{old="20260202_attendance.sql"; new="20260202120002_attendance.sql"},
  @{old="20260202_demo_requests.sql"; new="20260202120003_demo_requests.sql"},
  @{old="20260202_payments.sql"; new="20260202120004_payments.sql"},
  @{old="20260202_tenant_templates.sql"; new="20260202120005_tenant_templates.sql"},
  @{old="20260203_ceo_templates_ve_sablonlar.sql"; new="20260203120000_ceo_templates_ve_sablonlar.sql"},
  @{old="20260203_demo_requests_payment.sql"; new="20260203120001_demo_requests_payment.sql"},
  @{old="20260203_demo_requests_source_vitrin.sql"; new="20260203120002_demo_requests_source_vitrin.sql"},
  @{old="20260203_patron_commands_komut_sonuc_durum.sql"; new="20260203120003_patron_commands_komut_sonuc_durum.sql"},
  @{old="20260204_athlete_health_records.sql"; new="20260204120000_athlete_health_records.sql"},
  @{old="20260204_celf_kasa.sql"; new="20260204120001_celf_kasa.sql"},
  @{old="20260204_ceo_routines_seed.sql"; new="20260204120002_ceo_routines_seed.sql"},
  @{old="20260204_ceo_templates_columns.sql"; new="20260204120003_ceo_templates_columns.sql"},
  @{old="20260204_coo_depo_drafts_approved_published.sql"; new="20260204120004_coo_depo_drafts_approved_published.sql"},
  @{old="20260204_demo_requests_source_manychat.sql"; new="20260204120005_demo_requests_source_manychat.sql"},
  @{old="20260204_isletme_profili_kalite_puani.sql"; new="20260204120006_isletme_profili_kalite_puani.sql"},
  @{old="20260204_rls_celf_kasa_tenant_purchases_patron_commands.sql"; new="20260204120007_rls_celf_kasa_tenant_purchases_patron_commands.sql"},
  @{old="20260204_staff_extended_fields.sql"; new="20260204120008_staff_extended_fields.sql"},
  @{old="20260204_tenant_settings_schedule.sql"; new="20260204120009_tenant_settings_schedule.sql"},
  @{old="20260204_v0_template_library.sql"; new="20260204120010_v0_template_library.sql"},
  @{old="20260205_patron_commands_extended.sql"; new="20260205120000_patron_commands_extended.sql"},
  @{old="20260205_ticket_no.sql"; new="20260205120001_ticket_no.sql"},
  @{old="20260206_franchise_subdomains.sql"; new="20260206120000_franchise_subdomains.sql"},
  @{old="20260215_students_table.sql"; new="20260215120000_students_table.sql"},
  @{old="20260216_athletes_veli_group.sql"; new="20260216120000_athletes_veli_group.sql"},
  @{old="20260216_seans_packages_payments.sql"; new="20260216120001_seans_packages_payments.sql"},
  @{old="20260216_student_attendance.sql"; new="20260216120002_student_attendance.sql"},
  @{old="20260217_franchise_subdomains_tenant_link.sql"; new="20260217120000_franchise_subdomains_tenant_link.sql"},
  @{old="20260217_rls_athletes_attendance_payments.sql"; new="20260217120001_rls_athletes_attendance_payments.sql"},
  @{old="20260217_student_packages_athlete_id.sql"; new="20260217120002_student_packages_athlete_id.sql"},
  @{old="20260218_athletes_beklemede.sql"; new="20260218120000_athletes_beklemede.sql"},
  @{old="20260218_tenant_personnel_view.sql"; new="20260218120001_tenant_personnel_view.sql"},
  @{old="20260218_tenants_kurulum.sql"; new="20260218120002_tenants_kurulum.sql"},
  @{old="20260218_token_magaza.sql"; new="20260218120003_token_magaza.sql"},
  @{old="20260219_athletes_coach_user_id.sql"; new="20260219120000_athletes_coach_user_id.sql"},
  @{old="20260219_cash_register.sql"; new="20260219120001_cash_register.sql"},
  @{old="20260219_dijital_kredi.sql"; new="20260219120002_dijital_kredi.sql"},
  @{old="20260219_gelisim_olcum.sql"; new="20260219120003_gelisim_olcum.sql"},
  @{old="20260220_sozlesme_onaylari.sql"; new="20260220120000_sozlesme_onaylari.sql"}
)
foreach ($r in $renames) {
  $oldPath = Join-Path $base $r.old
  $newPath = Join-Path $base $r.new
  if (Test-Path $oldPath) {
    Rename-Item -Path $oldPath -NewName $r.new -Force
    Write-Host "Renamed: $($r.old) -> $($r.new)"
  }
}
Write-Host "Done."
