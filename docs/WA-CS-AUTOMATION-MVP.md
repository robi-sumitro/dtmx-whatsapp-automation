# Rancangan MVP — Automasi WhatsApp Business (CS Otomatis)

> Produk: bot layanan pelanggan (CS) otomatis via **WhatsApp Cloud API (Meta resmi)** untuk bisnis jasa lokal.
> Dokumen pengembangan ini disimpan di direktori `dtmx/` bersama dokumen desain lain.

**Tanggal:** 2026-08-06
**Status:** Draft desain — belum implementasi kode.

---

## 1. Keputusan Produk

### 1.1 Nilai yang dijual
Satu masalah sempit: *"Pelanggan kirim DM tapi telat dibalas / pesan hilang / karyawan sibuk."*
Kita jual **kecepatan & kerapatan merespons** — bukan sekadar tools chatbot.

### 1.2 Siapa targetnya
Bisnis jasa kecil-menengah yang dominan WhatsApp:
- Barbershop / salon / laundry
- Pet-shop / grooming
- Gym & kelas olahraga
- Layanan perawatan / jasa rumahan
- Kelas online / mentor / freelancer yang banyak chat pelanggan

Model harga: `Rp 99.000–199.000 / bulan / bisnis` + **jasa setup sekali** (`Rp 500rb–1jt`).

### 1.3 Kenapa WA Cloud API resmi (bukan QR)
- **JANGAN** pakai jalur QR / WhatsApp-Web internal (Baileys, whatsapp-web.js). Melanggar ToS → nomor diblokir, tidak dapat dipercaya untuk sumber pendapatan.
- **WA Cloud API (Meta)** memungkinkan development cepat dengan **temporary token**, dan rintangan *review publik* jauh lebih ringan daripada API posting Facebook/TikTok yang menjadi kendala DtmX. Inilah alasan produk ini lebih realistis untuk dibangun menjadi pendapatan.

---

## 2. Cakupan MVP v1

### 2.1 Fitur wajib (Must-have v1)
1. **Hubungkan nomor WhatsApp Business** via Meta Cloud API (login wewang; pakai nomor sendiri saat launch).
2. **Inbox multi-konversi** — pesan masuk webhook disimpan & ditampilkan per pelanggan; dashboard inbox di web; balas langsung dari situ.
3. **Auto-reply berbasis kondisi (rule/flow)** per konversasi:
   - Sapaan otomatis saat pesan pertama (GREETING).
   - Jawab kata kunci: `menu`, `harga`, `lokasi`, `jam buka`.
   - Balasan di luar jam kerja / hari libur.
   - Opsional integrasi **AI** (reuse panel `ai_settings` DtmX) untuk pertanyaan bebas.
4. **Quick replies / tombol** — balasan siap pakai sekali klik.
5. **Kirim template resmi (approved by Meta)** untuk pesan yang diprakarsai bisnis.
6. **Billing per bisnis** — langganan bulanan (reuse modul Plan/Subscription/payment Tripay–Midtrans DtmX).

### 2.2 Non-Goal v1 — JANGAN dibuat
- Kampanye **broadcast massal / blast** (butuh template sangat ketat + biaya; urus di v2).
- **Omnichannel** (IG/DM) atau multi-platform.
- **Multi-staff / RLS / audit log** lengkap.
- **Analitik** jumbo.

> Aturan arsitektur keras: maskar **pesan bebas (free-form)** HANYA sebagai balasan atas pesan pelanggan yang masuk (user-initiated). Balasan yang memulai dari bisnis (business-initiated) WAJIB pesan dari template **approved**. Ini aturan Meta & benteng dari spam/block.

---

## 3. Arsitektur Teknis

### 3.1 Stack (reuse DtmX)
- Backend: **NestJS** (modul baru `wa`)
- ORM: **Prisma** (tabel baru)
- Frontend: **React + Vite + Tailwind** (halaman Inbox + Settings + Plan)
- Queue: **BullMQ (Redis)** untuk kirim balasan & retry
- Integrasi AI: reuse tabel `ai_settings` + gateway provider (OpenAI/Anthropic/Gemini) dari DtmX
- Payment: reuse Tripay / Midtrans / Stripe

### 3.2 Diagram alur

```
Meta Cloud API
   │  Webhook (pesan masuk + status)
   ▼
[WaWebhookController /api/wa/webhook]  (verify token + signature)
   ▼
WaService.saveMessage()  →  Prisma insert
   ▼
[FlowEngine.evaluate(conversationId)]   (state: GREETING → MENU → QUOTE → CLOSE)
   ├─ match keyword/rule      ───────> send text reply
   └─ miss → [AIReplyGateway.useAi()] ─> send AI reply
   ▼
[SendQueue]  →  Meta Graph API `/messages`   (free-form jika user-initiated;
                                              template jika business-initiated)
   ▲
[Admin panel utama DtmX]  mengelola AiSettings, Plan, template

[apps/wa/web]  — Inbox UI (gaya DtmX): konversasi + balas + sidebar
```

### 3.3 Alur webhook (urutan produksi)
1. Meta request `?hub.mode=subscribe&hub.verify_token=...` → balas `hub.challenge`.
2. POST event `messages` / `statuses` → verifikasi **signature header `X-Hub-Signature-256`** (HMAC SHA-256 dengan `app_secret`).
3. Simpan pesan (`WaMessage`) → update `WaConversation` (buat baru jika belum ada).
4. Putar ke job queue → `FlowEngine` jalankan:
   - Jika sedang dalam state & match keyword → balas via rule.
   - Else → pakai AI (bila aktif).
5. Kirim lewat `https://graph.facebook.com/vXX.0/{PHONE_ID}/messages` dengan token.

### 3.4 Model Data (Prisma)
```prisma
model WaBusiness {
  id              String   @id @default(cuid())
  name            String
  phoneNumberId   String   @unique   // Meta Phone Number ID
  wabaId          String             // WhatsApp Business Account ID
  accessTokenEnc  String             // token TERENKRIPSI, jangan plaintext
  verified        Boolean  @default(false)
  planId          String?            // relasi ke Plan DtmX
  createdAt       DateTime @default(now())
}

model WaConversation {
  id           String   @id @default(cuid())
  businessId   String
  waRecipient  String            // nomor pelanggan (E.164, contoh 6281xxxxxxxx)
  customerName String?
  state        WaFlowState @default(GREETING)
  isAiEnabled  Boolean @default(true)
  lastAi       Boolean @default(false)
  updatedAt    DateTime @updatedAt
  createdAt    DateTime @default(now())
  @@index([businessId, waRecipient])
}

model WaMessage {
  id             String   @id @default(cuid())
  conversationId String
  direction      WaDirection   // INBOUND | OUTBOUND
  type           WaContentType // TEXT | TEMPLATE
  body           String
  metaMsgId      String?
  viaAi          Boolean  @default(false)
  sentAt         DateTime @default(now())
}

model WaTemplate {
  id         String @id @default(cuid())
  businessId String
  name       String      // nama slug approved Meta, mis. PESAN_ID_LANG
  language   String @default("id")
  body       String      // boleh pakai {{1}} parameter
  status     WaTemplateStatus
}

enum WaFlowState { GREETING MENU QUOTE CLOSE }
enum WaDirection { INBOUND OUTBOUND }
enum WaContentType { TEXT TEMPLATE }
enum WaTemplateStatus { APPROVED PENDING REJECTED }
```

Catatan keamanan: **token disimpan terenkripsi**, **tidak pernah** muncul di log. Ukuran: env `WA_APP_SECRET`, `WA_API_TOKEN`.

### 3.5 Konfigurasi AI (reuse `ai_settings`)
`FlowEngine` membaca provider aktif + key/model dari `ai_settings` (fallback ke env bila kosong) — pola yang sama dengan DtmX.

---

## 4. Alur FlowEngine (versi minimal)

```
Pesan masuk (INBOUND)
   |
   v
+--> state == GREETING?
|       jam kerja?   → "Halo, terima kasih sudah menghubungi. Bisa bantu apa?"
|       hari libur   → "Kami di luar jam. Balas otomatis ya..."
|       v
+--> match keyword (menu/harga/jam/lokasi)?
   |      yes → kirim teks rule
   |      no  → isAiEnabled? → AI reply  (cooldown + fallback)
   |            else → "Tim kami akan membalas sebentar lagi"
```
- Jangan jawab semua pesan dengan AI tanpa batasan; gunakan **cooldown** & batas token agar biaya terkendali.
- Simpan log transaksi `AiUsage` untuk kontrol biaya per nomor.

---

## 5. Billing & Monetisasi (reuse DtmX)

### 5.1 Fokus MVP: **Pembayaran Manual** (bukan gateway)
Gateway pembayaran (Tripay/Midtrans/Stripe) **juga butuh verifikasi bisnis & dokumen legal** sebelum bisa live.
Agar aliran kas berjalan **tanpa menunggu approval pihak ketiga**, versi MVP mengutamakan **pembayaran manual**:

- **Cara kerja manual:**
  - Pelanggan memilih paket → sistem membuat tagihan `Payment` dengan status `PENDING` + menampilkan **info rekening tujuan** (dari tabel `PaymentSetting`).
  - Pelanggan transfer ke rekening, lalu **upload bukti transfer** (langsung ke server / kirim ke nomor WA admin).
  - Admin (via Admin Panel) mengonfirmasi pembayaran → status `PAID` → langganan/nomor langsung **aktif**.
- **Keuntungan:** tidak menunggu approval gateway, biaya transaksi 0 (saya tulis flat), dan cocok untuk pilot 2–3 bisnis.
- **Jasa setup/pemasangan** (pasang nomor, bikin template, latih bot, integrasi AI) → bayar **transfer manual** pula, tercatat di `PaymentSetting` / invoice.
- **Proses paper trail:** buat tabel `WaInvoice` + `InvoiceProof` (lampiran bukti) sehingga klaim & audit mudah.

### 5.2 Gateway otomatis (tahap lanjutan / P3)
Setelah verifikasi gateway selesai, tambahkan **Tripay / Midtrans** sebagai metode alternatif dengan alur yang sudah ada di DtmX (`subscribe` + webhook). Manual tetap disediakan sebagai fallback.

### 5.3 Alur aktivasi untuk MVP manual

```
Pelanggan pilih paket
   → generate INVOICE (PENDING) + tampilkan rekening tujuan
   → pelanggan transfer & upload BUKTI (invoice_file)
   → Admin konfirmasi (ACC)  → status PAID → nomor/handler aktif
        (reject dengan catatan bila bukti tidak valid)
```

### 5.4 catatan kolom tambahan (Prisma)
```prisma
model WaInvoice {
  id            String @id @default(cuid())
  businessId    String
  amount        Float
  currency      String @default("IDR")
  status        WaInvoiceStatus  // PENDING | PAID | REJECTED
  note          String?
  planId        String?
  createdAt     DateTime @default(now())
  paidAt        DateTime?
}

model WaInvoiceProof {
  id         String @id @default(cuid())
  invoiceId  String
  fileUrl    String
  note       String?
  createdAt  DateTime @default(now())
}

enum WaInvoiceStatus { PENDING PAID REJECTED }
```

### 5.5 Kuota AI
Pakai `AiUsage` sebagai catatan agar biaya token terkontrol per-nomor (reuse DtmX).

---

## 6. Roadmap & langkah kerja
- **[P1 – Setup Meta]** daftar WABA, buat app, ambil **temporary token**, tentukan Phone Number ID.
- **[P1 – Backend]** module `wa`: verify webhook + simpan pesan + kirim balas (test curl/Postman).
- **[P1 – Frontend]** halaman **Inbox** (kema DtmX) + Settings + koneksi nomor.
- **[P1 – Bot]** rule/flow (GREETING + kata kunci + luar jam) + toggle AI.
- **[P2 – Approval]** submit **business verification** + **template** (1–4) ke Meta.
- **[P2 – Uji]** nomor sendiri → lalu 2–3 **bisnis uji-coba berbayar**.
- **[P2 – Billing]** aktifkan paket langganan sebelum uji-coba.
- **[P3 – Iterasi]** misue feedback → tambah analitik, dll.

---

## 7. Risiko & Mitigasi
| Risiko | Mitigasi |
| --- | --- |
| Nomor diblokir / spam | Hanya free-form untuk user-initiated; business-initiated selalu template-approved; rate limit. |
| Approval template ditolak | Siapkan beberapa varian; patuhi aturan Meta (tanpa promosi berlebihan, tanpa URL shortener, pakai `{{1}}`). |
| Biaya API WA | Ada free tier 1.000 konversi/bulan untuk uji; harga jual dihitung di atas biaya API. |
| Bot salah jawab | Mode AI terbatas per-state, cooldown, fallback ke manusia, list semua log. |
| Dependensi Meta | Siapkan fallback ke BSP (Twilio/Vonage/API lokal); mulai dengan Cloud API. |

---

## 8. Kriteria "v1 SELESAI" (Definition of Done)
- [ ] Nomor bisnis tersambung dan menerima test webhook hidup.
- [ ] Pesan masuk tampil real-time di Inbox; bisa dibalas.
- [ ] Flow bot: GREETING + kata kunci + luar jam (tanpa & dengan AI) berfungsi.
- [ ] Kiriman ke nomor sendiri teruji 3 skenario (awal / keyword / bebas).
- [ ] Billing bulanan via payment yang sudah ada berfungsi.
- [ ] Setup/verifikasi Meta (business verification + 1 template approved) selesai.
- [ ] Dokumentasi tutorial setup untuk calon pelanggan.

---

*Dokumen ini dikelola di direktori `dtmx/`. Anda dapat menambah versi, dan menyimpan dokumen desain lainnya di tempat yang sama.*