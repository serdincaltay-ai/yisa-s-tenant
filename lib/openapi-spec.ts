/**
 * OpenAPI 3.0 Specification — tenant-yisa-s API
 * Bu dosya tüm ana endpoint'lerin dokümantasyonunu içerir.
 * Swagger UI sayfası (/api-docs) bu spec'i kullanır.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const spec: Record<string, any> = {
  openapi: '3.0.3',
  info: {
    title: 'Yisa-S Tenant API',
    version: '1.0.0',
    description:
      'Yisa-S spor tesisi yönetim platformu API dokümantasyonu. ' +
      'Franchise, veli paneli, ödemeler, webhooks ve diğer endpoint\'leri içerir.',
    contact: { email: 'info@yisa-s.com' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Geliştirme' },
    { url: 'https://{slug}.yisa-s.com', description: 'Prodüksiyon (Franchise)' },
  ],
  tags: [
    { name: 'Demo', description: 'Demo talepleri' },
    { name: 'Franchise — Ayarlar', description: 'Tesis ayarları' },
    { name: 'Franchise — Sporcular', description: 'Sporcu (öğrenci) yönetimi' },
    { name: 'Franchise — Ödemeler', description: 'Aidat ve ödeme yönetimi' },
    { name: 'Franchise — Program', description: 'Haftalık ders programı' },
    { name: 'Franchise — Yoklama', description: 'Devamsızlık takibi' },
    { name: 'Franchise — Sağlık', description: 'Sağlık kayıtları' },
    { name: 'Franchise — Personel', description: 'Personel yönetimi' },
    { name: 'Veli', description: 'Veli paneli endpoint\'leri' },
    { name: 'Ödemeler', description: 'Genel ödeme endpoint\'leri' },
    { name: 'Webhooks', description: 'Stripe & ManyChat webhook\'ları' },
    { name: 'Bildirimler', description: 'Push bildirim gönderimi' },
    { name: 'Temizlik', description: 'Temizlik kontrol listesi' },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase JWT token (Authorization: Bearer <token>)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Giriş gerekli' },
        },
      },
      OkResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
        },
      },
      DemoRequest: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Ali Yılmaz' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', example: '+905551234567' },
          facility_type: { type: 'string', example: 'spor_salonu' },
          city: { type: 'string', example: 'İstanbul' },
          notes: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          source: { type: 'string', enum: ['www', 'demo', 'fiyatlar', 'vitrin', 'manychat'] },
          created_at: { type: 'string', format: 'date-time' },
          payment_status: { type: 'string' },
          payment_amount: { type: 'number' },
        },
      },
      Athlete: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Ayşe' },
          surname: { type: 'string', example: 'Kaya' },
          birth_date: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['E', 'K', 'diger'] },
          branch: { type: 'string', example: 'yüzme' },
          level: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive', 'trial'] },
          parent_name: { type: 'string' },
          parent_phone: { type: 'string' },
          parent_email: { type: 'string', format: 'email' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          athlete_id: { type: 'string', format: 'uuid' },
          athlete_name: { type: 'string' },
          amount: { type: 'number', example: 700 },
          payment_type: { type: 'string', enum: ['aidat', 'kayit', 'ekstra'] },
          period_month: { type: 'integer', example: 3 },
          period_year: { type: 'integer', example: 2026 },
          due_date: { type: 'string', format: 'date' },
          paid_date: { type: 'string', format: 'date', nullable: true },
          status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled'] },
          payment_method: { type: 'string', enum: ['nakit', 'kart', 'havale', 'eft'] },
        },
      },
      Staff: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Mehmet' },
          surname: { type: 'string', example: 'Demir' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'manager', 'trainer', 'receptionist', 'cleaning', 'other'] },
          branch: { type: 'string' },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ScheduleItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          gun: { type: 'string', enum: ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar'] },
          saat: { type: 'string', example: '09:00' },
          ders_adi: { type: 'string', example: 'Yüzme A Grubu' },
          brans: { type: 'string' },
          seviye: { type: 'string' },
          antrenor_id: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      AttendanceRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          athlete_id: { type: 'string', format: 'uuid' },
          athlete_name: { type: 'string' },
          lesson_date: { type: 'string', format: 'date' },
          status: { type: 'string', enum: ['present', 'absent', 'late', 'excused'] },
          notes: { type: 'string' },
        },
      },
      HealthRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          athlete_id: { type: 'string', format: 'uuid' },
          athlete_name: { type: 'string' },
          record_type: { type: 'string', example: 'genel' },
          notes: { type: 'string' },
          recorded_at: { type: 'string', format: 'date-time' },
        },
      },
      Child: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          surname: { type: 'string' },
          birth_date: { type: 'string', format: 'date' },
          gender: { type: 'string' },
          branch: { type: 'string' },
          level: { type: 'string' },
          status: { type: 'string' },
          ders_kredisi: { type: 'number' },
          toplam_kredi: { type: 'number' },
        },
      },
      ChecklistItem: {
        type: 'object',
        properties: {
          alan: { type: 'string', example: 'Salon' },
          vardiya: { type: 'string', example: 'Sabah' },
          yapildi: { type: 'boolean' },
          not: { type: 'string' },
        },
      },
    },
  },

  security: [{ bearerAuth: [] }],

  paths: {
    /* ────────────────────── Demo ────────────────────── */
    '/api/demo-requests': {
      get: {
        tags: ['Demo'],
        summary: 'Demo taleplerini listele',
        description: 'Patron paneli: Tüm demo taleplerini en yeniden eskiye listeler (max 100).',
        responses: {
          '200': {
            description: 'Demo talepleri listesi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/DemoRequest' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Demo'],
        summary: 'Yeni demo talebi veya karar ver',
        description:
          'action yoksa: Yeni demo talebi oluşturur (name, email zorunlu).\n' +
          'action=decide: Onay/red kararı (Patron yetkisi gerekli).\n' +
          'action=record_payment: Ödeme kaydı (Patron yetkisi gerekli).',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Ali Yılmaz' },
                  email: { type: 'string', format: 'email', example: 'ali@example.com' },
                  phone: { type: 'string' },
                  facility_type: { type: 'string' },
                  city: { type: 'string' },
                  notes: { type: 'string' },
                  source: { type: 'string', enum: ['www', 'demo', 'fiyatlar', 'vitrin'] },
                  action: { type: 'string', enum: ['decide', 'record_payment'] },
                  decision: { type: 'string', enum: ['approve', 'reject'] },
                },
                required: ['name', 'email'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Talep oluşturuldu veya karar verildi',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
          },
          '400': { description: 'Validasyon hatası', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    /* ────────────────────── Franchise Ayarlar ────────────────────── */
    '/api/franchise/settings': {
      get: {
        tags: ['Franchise — Ayarlar'],
        summary: 'Tesis ayarlarını getir',
        description: 'Giriş yapan kullanıcının tenant bilgilerini döner: hedefler, aidat kademeleri, branding, sosyal medya, iletişim.',
        responses: {
          '200': {
            description: 'Tenant ayarları',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tenant: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        package_type: { type: 'string' },
                        antrenor_hedef: { type: 'number' },
                        temizlik_hedef: { type: 'number' },
                        mudur_hedef: { type: 'number' },
                        aidat_tiers: { type: 'object' },
                        logo_url: { type: 'string' },
                        primary_color: { type: 'string', example: '#1e3a5f' },
                        phone: { type: 'string' },
                        email: { type: 'string' },
                        address: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Giriş gerekli', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Tesis atanmamış', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Franchise — Ayarlar'],
        summary: 'Tesis ayarlarını güncelle',
        description: 'Hedefler, renk paleti, sosyal medya URL\'leri, iletişim bilgilerini günceller. Renk: #RRGGBB, URL: https:// zorunlu.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  antrenor_hedef: { type: 'number' },
                  temizlik_hedef: { type: 'number' },
                  mudur_hedef: { type: 'number' },
                  aidat_tiers: { type: 'object', example: { '25': 500, '45': 700, '60': 900 } },
                  primary_color: { type: 'string', example: '#1e3a5f' },
                  secondary_color: { type: 'string' },
                  accent_color: { type: 'string' },
                  instagram_url: { type: 'string' },
                  whatsapp_number: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  address: { type: 'string' },
                  working_hours: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Güncelleme başarılı', content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } } },
          '400': { description: 'Validasyon hatası', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    /* ────────────────────── Franchise Sporcular ────────────────────── */
    '/api/franchise/athletes': {
      get: {
        tags: ['Franchise — Sporcular'],
        summary: 'Sporcuları listele',
        description: 'Tenant\'a ait sporcuları listeler. Opsiyonel filtreler: q (arama), status, branch.',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Ad/soyad arama' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'trial'] } },
          { name: 'branch', in: 'query', schema: { type: 'string' }, description: 'Branş filtresi' },
        ],
        responses: {
          '200': {
            description: 'Sporcu listesi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Athlete' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Franchise — Sporcular'],
        summary: 'Yeni sporcu ekle',
        description: 'Yeni sporcu kaydı oluşturur. name zorunludur.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Ayşe' },
                  surname: { type: 'string', example: 'Kaya' },
                  birth_date: { type: 'string', format: 'date' },
                  gender: { type: 'string', enum: ['E', 'K', 'diger'] },
                  branch: { type: 'string' },
                  level: { type: 'string' },
                  group: { type: 'string' },
                  parent_name: { type: 'string' },
                  parent_phone: { type: 'string' },
                  parent_email: { type: 'string', format: 'email' },
                  notes: { type: 'string' },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Sporcu oluşturuldu',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    athlete: { $ref: '#/components/schemas/Athlete' },
                  },
                },
              },
            },
          },
          '400': { description: 'Ad zorunludur', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    /* ────────────────────── Franchise Ödemeler ────────────────────── */
    '/api/franchise/payments': {
      get: {
        tags: ['Franchise — Ödemeler'],
        summary: 'Ödeme listesi',
        description: 'Tenant\'a ait ödeme kayıtlarını listeler. Filtreler: status, period_month, period_year.',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled'] } },
          { name: 'period_month', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 12 } },
          { name: 'period_year', in: 'query', schema: { type: 'integer', minimum: 2020, maximum: 2030 } },
        ],
        responses: {
          '200': {
            description: 'Ödeme listesi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Payment' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Franchise — Ödemeler'],
        summary: 'Ödeme oluştur',
        description: 'Tekli ödeme veya toplu aidat oluşturma (bulk=true). Kasa kaydı otomatik eklenir.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  athlete_id: { type: 'string', format: 'uuid' },
                  amount: { type: 'number', example: 700 },
                  payment_type: { type: 'string', enum: ['aidat', 'kayit', 'ekstra'] },
                  period_month: { type: 'integer' },
                  period_year: { type: 'integer' },
                  due_date: { type: 'string', format: 'date' },
                  paid_date: { type: 'string', format: 'date' },
                  payment_method: { type: 'string', enum: ['nakit', 'kart', 'havale', 'eft'] },
                  bulk: { type: 'boolean', description: 'true ise tüm aktif üyeler için toplu aidat' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Ödeme kaydedildi', content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } } },
          '400': { description: 'Validasyon hatası', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Franchise — Ödemeler'],
        summary: 'Ödeme güncelle',
        description: 'Tekli veya toplu ödeme güncelleme. bulk=true + ids[] ile toplu güncelleme.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled'] },
                  paid_date: { type: 'string', format: 'date' },
                  payment_method: { type: 'string', enum: ['nakit', 'kart', 'havale', 'eft'] },
                  bulk: { type: 'boolean' },
                  ids: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Güncelleme başarılı', content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } } },
        },
      },
    },

    /* ────────────────────── Franchise Program ────────────────────── */
    '/api/franchise/schedule': {
      get: {
        tags: ['Franchise — Program'],
        summary: 'Ders programını getir',
        description: 'Tenant\'ın haftalık ders programını getirir.',
        responses: {
          '200': {
            description: 'Program listesi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/ScheduleItem' } },
                    gunler: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Franchise — Program'],
        summary: 'Ders ekle/güncelle',
        description: 'Tek ders kaydı upsert (tenant_id + gün + saat unique).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  gun: { type: 'string', enum: ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar'] },
                  saat: { type: 'string', example: '09:00' },
                  ders_adi: { type: 'string', example: 'Yüzme A Grubu' },
                  antrenor_id: { type: 'string', format: 'uuid' },
                  brans: { type: 'string' },
                  seviye: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Ders kaydedildi', content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } } },
        },
      },
      put: {
        tags: ['Franchise — Program'],
        summary: 'Programı toplu güncelle',
        description: 'Tüm programı atomik olarak günceller: upsert + eski kayıtları sil.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  items: { type: 'array', items: { $ref: '#/components/schemas/ScheduleItem' } },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Program güncellendi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { ok: { type: 'boolean' }, count: { type: 'integer' } },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Franchise — Program'],
        summary: 'Ders sil',
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Ders silindi', content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } } },
        },
      },
    },

    /* ────────────────────── Franchise Yoklama ────────────────────── */
    '/api/franchise/attendance': {
      get: {
        tags: ['Franchise — Yoklama'],
        summary: 'Yoklama kayıtlarını getir',
        description: 'Belirli tarih (date) veya tarih aralığı (from/to) için yoklama verileri.',
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Tek gün (YYYY-MM-DD)' },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Başlangıç tarihi (özet mod)' },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Bitiş tarihi (özet mod)' },
        ],
        responses: {
          '200': {
            description: 'Yoklama verileri',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/AttendanceRecord' } },
                    summary: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Franchise — Yoklama'],
        summary: 'Yoklama kaydet',
        description: 'Toplu yoklama kaydı (upsert). Devamsızlıklar için SMS hatırlatma tetiklenir.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  records: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        athlete_id: { type: 'string', format: 'uuid' },
                        lesson_date: { type: 'string', format: 'date' },
                        status: { type: 'string', enum: ['present', 'absent', 'late', 'excused'] },
                      },
                      required: ['athlete_id', 'lesson_date'],
                    },
                  },
                },
                required: ['records'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Yoklama kaydedildi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { ok: { type: 'boolean' }, count: { type: 'integer' } },
                },
              },
            },
          },
        },
      },
    },

    /* ────────────────────── Franchise Sağlık ────────────────────── */
    '/api/franchise/health-records': {
      get: {
        tags: ['Franchise — Sağlık'],
        summary: 'Sağlık kayıtlarını listele',
        description: 'Tenant\'a ait tüm sporcuların sağlık kayıtları + 1 yıldan eski kayıtlar için uyarılar.',
        responses: {
          '200': {
            description: 'Sağlık kayıtları ve uyarılar',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/HealthRecord' } },
                    warnings: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Franchise — Sağlık'],
        summary: 'Sağlık kaydı ekle',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  athlete_id: { type: 'string', format: 'uuid' },
                  record_type: { type: 'string', example: 'genel' },
                  notes: { type: 'string' },
                },
                required: ['athlete_id'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Kayıt oluşturuldu',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { ok: { type: 'boolean' }, item: { $ref: '#/components/schemas/HealthRecord' } },
                },
              },
            },
          },
        },
      },
    },

    /* ────────────────────── Franchise Personel ────────────────────── */
    '/api/franchise/staff': {
      get: {
        tags: ['Franchise — Personel'],
        summary: 'Personel listesi',
        description: 'Tenant\'a ait tüm personel kayıtlarını listeler.',
        responses: {
          '200': {
            description: 'Personel listesi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Staff' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Franchise — Personel'],
        summary: 'Yeni personel ekle',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Mehmet' },
                  surname: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'manager', 'trainer', 'receptionist', 'cleaning', 'other'] },
                  branch: { type: 'string' },
                  birth_date: { type: 'string', format: 'date' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Personel kaydedildi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { ok: { type: 'boolean' }, staff: { $ref: '#/components/schemas/Staff' } },
                },
              },
            },
          },
        },
      },
    },

    /* ────────────────────── Veli ────────────────────── */
    '/api/veli/children': {
      get: {
        tags: ['Veli'],
        summary: 'Çocuk listesi',
        description: 'Giriş yapan velinin çocuklarını (parent_user_id eşleşmesi) döner. İlk girişte parent_email ile otomatik bağlama yapar.',
        responses: {
          '200': {
            description: 'Çocuk listesi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Child' } },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/veli/payments': {
      get: {
        tags: ['Veli'],
        summary: 'Veli ödeme listesi',
        description: 'Velinin çocuklarına ait ödeme kayıtları + toplam borç tutarı.',
        responses: {
          '200': {
            description: 'Ödemeler ve toplam borç',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Payment' } },
                    totalDebt: { type: 'number', example: 1400 },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/veli/attendance': {
      get: {
        tags: ['Veli'],
        summary: 'Çocuk yoklama geçmişi',
        description: 'Son N gün (varsayılan 30) içindeki yoklama kayıtları + devam oranı.',
        parameters: [
          { name: 'athlete_id', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Belirli bir çocuk' },
          { name: 'days', in: 'query', schema: { type: 'integer', default: 30 }, description: 'Kaç gün geriye bakılsın' },
        ],
        responses: {
          '200': {
            description: 'Yoklama verileri',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/AttendanceRecord' } },
                    attendanceRate: { type: 'integer', example: 85 },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/veli/schedule': {
      get: {
        tags: ['Veli'],
        summary: 'Çocuk ders programı',
        description: 'Belirli bir çocuğun haftalık ders programı (veli sahiplik kontrolü yapılır).',
        parameters: [
          { name: 'athlete_id', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Ders programı',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          day: { type: 'string' },
                          time: { type: 'string' },
                          type: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/veli/health': {
      get: {
        tags: ['Veli'],
        summary: 'Çocuk sağlık verileri',
        description: 'Uyku, beslenme, esneklik, kuvvet, hız skorları.',
        parameters: [
          { name: 'athlete_id', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Sağlık verileri',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        sleep: { type: 'object', properties: { average: { type: 'number' }, target: { type: 'number' } } },
                        nutrition: { type: 'object', properties: { score: { type: 'number' }, target: { type: 'number' } } },
                        flexibility: { type: 'object', properties: { score: { type: 'number' }, change: { type: 'string' } } },
                        strength: { type: 'object', properties: { score: { type: 'number' }, change: { type: 'string' } } },
                        speed: { type: 'object', properties: { score: { type: 'number' }, change: { type: 'string' } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/veli/gelisim': {
      get: {
        tags: ['Veli'],
        summary: 'Gelişim ölçümleri',
        description: 'Çocuğun boy, kilo, esneklik ölçüm geçmişi (athlete_measurements + gelisim_olcumleri birleşik).',
        parameters: [
          { name: 'athlete_id', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Ölçüm geçmişi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          olcum_tarihi: { type: 'string', format: 'date' },
                          boy: { type: 'number', nullable: true },
                          kilo: { type: 'number', nullable: true },
                          esneklik: { type: 'number', nullable: true },
                          genel_degerlendirme: { type: 'string', nullable: true },
                          kaynak: { type: 'string', enum: ['athlete_measurements', 'gelisim_olcumleri'] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/veli/kredi': {
      get: {
        tags: ['Veli'],
        summary: 'Kredi paketleri ve çocuklar',
        description: 'Mevcut kredi paketleri (tenant ayarlarından) ve çocukların kredi bakiyeleri.',
        responses: {
          '200': {
            description: 'Paketler ve çocuklar',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    packages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          isim: { type: 'string', example: '10 Ders Paketi' },
                          saat: { type: 'number', example: 10 },
                          fiyat: { type: 'number', example: 2000 },
                        },
                      },
                    },
                    children: { type: 'array', items: { $ref: '#/components/schemas/Child' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Veli'],
        summary: 'Kredi paketi satın al',
        description: 'Seçilen çocuğa kredi paketi ekler. Ödeme + kasa kaydı oluşturulur.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  athlete_id: { type: 'string', format: 'uuid' },
                  paket_index: { type: 'integer', description: 'Paket dizisindeki index' },
                  odeme_yontemi: { type: 'string', enum: ['nakit', 'kart', 'havale'] },
                },
                required: ['athlete_id', 'paket_index'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Paket satın alındı',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    ders_kredisi: { type: 'number' },
                    payment_id: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/veli/messages': {
      get: {
        tags: ['Veli'],
        summary: 'Mesaj konuşmaları',
        description: 'Veli–antrenör mesajlaşma (şimdilik boş — ileride aktif olacak).',
        parameters: [
          { name: 'thread_id', in: 'query', schema: { type: 'string' }, description: 'Konuşma ID (belirtilmezse tüm konuşmalar)' },
        ],
        responses: {
          '200': {
            description: 'Konuşmalar',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    threads: { type: 'array', items: { type: 'object' } },
                    messages: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Veli'],
        summary: 'Mesaj gönder',
        description: 'İleride aktif olacak mesaj gönderim endpoint\'i.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  thread_id: { type: 'string' },
                  message: { type: 'string' },
                },
                required: ['message'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Mesaj gönderildi', content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } } },
        },
      },
    },

    /* ────────────────────── Genel Ödemeler ────────────────────── */
    '/api/payments': {
      get: {
        tags: ['Ödemeler'],
        summary: 'Paket ödeme listesi',
        description: 'package_payments tablosundan ödeme kayıtları. Filtre: status, athlete_id. Gecikmiş ödemeler otomatik işaretlenir.',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['bekliyor', 'odendi', 'gecikmis'] } },
          { name: 'athlete_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Ödeme listesi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          athlete_id: { type: 'string' },
                          ad_soyad: { type: 'string' },
                          amount: { type: 'number' },
                          effective_status: { type: 'string' },
                          due_date: { type: 'string', format: 'date' },
                          kalan_seans: { type: 'number', nullable: true },
                          paket_adi: { type: 'string', nullable: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Ödemeler'],
        summary: 'Ödeme oluştur veya ödeme al',
        description: 'Yeni ödeme kaydı. payment_id varsa mevcut ödemeyi "ödendi" olarak günceller.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  athlete_id: { type: 'string', format: 'uuid' },
                  amount: { type: 'number' },
                  payment_date: { type: 'string', format: 'date' },
                  payment_method: { type: 'string', enum: ['nakit', 'havale', 'kredi_karti', 'diger'] },
                  payment_id: { type: 'string', description: 'Mevcut ödemeyi güncelle' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Ödeme kaydedildi', content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } } },
        },
      },
    },

    '/api/payments/{id}': {
      patch: {
        tags: ['Ödemeler'],
        summary: 'Ödeme detay güncelle',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['bekliyor', 'odendi', 'gecikmis', 'iptal'] },
                  payment_date: { type: 'string', format: 'date' },
                  payment_method: { type: 'string' },
                  receipt_no: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Güncellendi' },
          '404': { description: 'Ödeme bulunamadı', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/payments/create-checkout': {
      post: {
        tags: ['Ödemeler'],
        summary: 'Stripe Checkout oturumu oluştur',
        description: 'Seçilen bekleyen ödemeler için Stripe Checkout Session oluşturur. Checkout URL döner.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  payment_ids: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    maxItems: 13,
                    description: 'Ödenecek ödeme ID\'leri (max 13)',
                  },
                },
                required: ['payment_ids'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Checkout URL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', format: 'uri' },
                    session_id: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    /* ────────────────────── Webhooks ────────────────────── */
    '/api/webhooks/stripe': {
      post: {
        tags: ['Webhooks'],
        summary: 'Stripe webhook handler',
        description:
          'checkout.session.completed event\'ini dinler. Ödeme başarılıysa ilgili kayıtları "ödendi" olarak günceller. ' +
          'STRIPE_WEBHOOK_SECRET ile HMAC doğrulama yapar.',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          '200': {
            description: 'Event işlendi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    received: { type: 'boolean' },
                    status: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
          '400': { description: 'İmza hatası', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/webhooks/manychat': {
      get: {
        tags: ['Webhooks'],
        summary: 'ManyChat webhook sağlık kontrolü',
        description: 'Webhook durumunu ve toplam lead sayısını döner (PII göstermez).',
        security: [],
        responses: {
          '200': {
            description: 'Webhook durumu',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    webhook: { type: 'string' },
                    totalLeads: { type: 'integer' },
                    totalCrmContacts: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'ManyChat lead webhook',
        description:
          'ManyChat\'ten gelen lead\'i crm_contacts + crm_activities + demo_requests tablolarına yazar. ' +
          'HMAC-SHA256 imza doğrulama (MANYCHAT_WEBHOOK_SECRET).',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  city: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Lead kaydedildi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    crm_contact_id: { type: 'string' },
                    demo_request_id: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': { description: 'Geçersiz imza', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    /* ────────────────────── Bildirimler ────────────────────── */
    '/api/notifications/send': {
      post: {
        tags: ['Bildirimler'],
        summary: 'Push bildirim gönder',
        description: 'Belirli bir kullanıcıya push bildirim gönderir. Patron veya yetkili roller gerekli.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user_id: { type: 'string', format: 'uuid' },
                  notification_type: { type: 'string', enum: ['yoklama_sonucu', 'odeme_hatirlatma', 'duyuru'] },
                  title: { type: 'string', example: 'Ödeme Hatırlatma' },
                  body: { type: 'string', example: 'Mart ayı aidatınız beklemektedir.' },
                  url: { type: 'string', format: 'uri' },
                },
                required: ['user_id', 'notification_type', 'title'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Bildirim gönderildi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    gonderilen: { type: 'integer' },
                    toplam_abonelik: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },

    /* ────────────────────── Temizlik ────────────────────── */
    '/api/temizlik/checklist': {
      get: {
        tags: ['Temizlik'],
        summary: 'Günlük checklist getir',
        description: 'Belirtilen tarihe ait temizlik kontrol listesini getirir.',
        parameters: [
          { name: 'tarih', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Tarih (varsayılan: bugün)' },
        ],
        responses: {
          '200': {
            description: 'Checklist verisi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    checklist: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        id: { type: 'string' },
                        tarih: { type: 'string', format: 'date' },
                        items: { type: 'array', items: { $ref: '#/components/schemas/ChecklistItem' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Temizlik'],
        summary: 'Checklist kaydet',
        description: 'Günlük temizlik kontrol listesini upsert eder (aynı gün + user + tenant).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  tarih: { type: 'string', format: 'date' },
                  items: { type: 'array', items: { $ref: '#/components/schemas/ChecklistItem' } },
                },
                required: ['items'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Checklist kaydedildi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    checklist: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

export default spec
