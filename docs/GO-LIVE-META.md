# Go-Live — Verifikasi & Persetujuan WhatsApp Cloud API (Meta)

> Panduan paling penting sebelum aplikasi **diterbitkan** ke produksi. Kesalahan pada
> tahap ini bisa membuat nomor diblokir, template ditolak, atau bot berhenti mengirim.
> Token/password sengaja tidak dicantumkan di sini — hanya alur & kriterianya.

**Tujuan:** membawa aplikasi dari uji-coba (development) ke produksi **tanpa kena blokir**.

---

## 1. Mengapa langkah ini krusial

Meta memberlakukan beberapa "gerbang". WhatsApp Cloud API **lebih cepat ditembus**
daripada API posting Facebook/TikTok (pengalaman DtmX), tetapi tetap wajib patuh. Jika
tidak:

- Nomor terus berada dalam **sandbox** (hanya bisa kirim ke nomor terdaftar sebagai test number).
- **Template** ditolak/ditahan, menghambat balasan business-initiated.
- Akun mendapat **peringatan spam** → pembatasan, bahkan **blokir permanen**.

---

## 2. Ringkasan Alur (overview)

```
D1. Buat App Meta (Business type)
D2. Siapkan WhatsApp Business Account (WABA) + Business Verification
D3. Daftarkan Phone Number (nomor bot) & OTP
D4. Buat System User + token permanent (bukan development/temporary)
D5. Subscribe Webhook ke endpoint aplikasi (path /wa/webhook)
D6. Verifikasi Display Name & kuota nomor
D7. Buat template → tunggu APPROVED
D8. Keluar dari sandbox → mode Live (Advanced Access disetujui)
```

---

## 3. Detail per langkah

### 3.1 App Meta (Business)
- Buka `developers.facebook.com` → **My Apps** → **Create App**.
- Pilih Business Type = **Business** (untuk WhatsApp Cloud API).
- Tarik modul **WhatsApp** → *Set up* → pilih WABA (atau buat baru).

### 3.2 WABA & Business Verification
- Dalam **Business Manager** → *Settings* → *Business Verification*.
- Sediakan (waktu proses bisa berhari-hari s.d. beberapa minggu):
  - Nama **legal** bisnis, situs web + email domain bisnis.
  - Dokumen legal (akte / NPWP / SIUP, sesuai lokasi).
- **Percepatan:** business verification mempercepat akses Phone Number, kuota,
  dan approval template.
- Jika ditolak → baca alasan di Business Manager → perbaiki → ajukan ulang.

### 3.3 Phone Number (nomor bot)
- Di WABA → *Phone Numbers* → *Add Phone Number* (gunakan nomor yang Anda kendalikan).
- Verifikasi via **OTP** (SMS). Wajib.
- **Display name** harus sesuai brand. Hindari display name yang sangat baru/rentan spam.

### 3.4 System User & token permanent
- Business Manager → **System Users** → *Add System User*.
  - Role: **Admin** untuk WABA + App + Phone Number.
  - *Generate new token* → pilih *access token*.
- Scopes / permissions yang dibutuhkan:
  - `whatsapp_business_management`
  - `business_management`
  - `whatsapp_business_messaging`
- Salin token → isi ke `WA_API_TOKEN` di `.env`.
- **Perbedaan token:**
  - **Temporary token** → khusus uji-coba cepat (±24 jam), ada di *Getting Started*.
  - **System User token** → **permanent** (siap produksi).
- Token disimpan **terenskripsi** dalam DB (kolom `accessTokenEnc`),
  dan `APP_ENCKEY` wajib menstim produksi.

### 3.5 Webhook subscription
- Di WABA > *Configuration* > *Webhook* → isi URL publik:
  ```
  {BASE_URL}/api/wa/webhook
  ```
- **Verify Token** = sembarang rahasia, HARUS identik dengan `WA_VERIFY_TOKEN` di `.env`.
  Endpoint akan merespons GET *challenge* pada path yang sama (handshake).
- Subscribe ke field: `messages` dan `message_template_status_update`.

### 3.6 Nomor status & kuota
- Di WABA > *Phone Numbers* → pilih nomor → pastikan aktif.
- Kuota pesan conflict bergantung `Business Verification` + jumlah nomor (tier).

### 3.7 Template & approval
- Satu template (mis. `info_layanan`) diajukan di
  Business Manager > WhatsApp > Message Templates > Create.
- Ciri agar **lolos approval**:
  - Isi **faktual, non-promo opsional** sesuai use case; jangan klaim berlebihan.
  - Gunakan **variabel** `{{1}}` untuk konten dinamis (nama/nomor), bukan teks statis.
  - Hindari: URL shortener, kata-kata promosi palsu (garansi berlebihan), isi yang terdekat dengan spam.
- Status: `PENDING` → `APPROVED`/`REJECTED` (+alasan).
- **Hanya `APPROVED`** yang bisa dipakai pesan business-initiated.

### 3.8 Sandbox → Live
- Default: mode **sandbox** (hanya kirim ke nomor test yang Anda daftar).
- Untuk rilis produksi, aktifkan **Advanced Access** untuk `whatsapp_business_messaging`:
  Platform App → **App Review** → *Get Advanced Access* → *Submit for review*.
- Setelah disetujui → Anda di mode **Live** (dapat kirim ke nomor bebas).

---

## 4. Checklist verifikasi produksi

- [ ] App Meta (Business) dibuat & WhatsApp Cloud API terpasang.
- [ ] **Business Verification** selesai (bukan PENDING).
- [ ] Nomor phone terhubung ke WABA; **display name** sesuai brand.
- [ ] **System User permanent token** dibuat → `WA_API_TOKEN`.
- [ ] **Webhook** `/api/wa/webhook` sudah subscribe; handshake 200 OK; token cocok.
- [ ] Field webhook `messages` + `message_template_status` aktif.
- [ ] Minimal **1 template `APPROVED`** untuk business-initiated.
- [ ] `WA_APP_SECRET` & `APP_ENCKEY` terisi (verifikasi signature + enkripsi token).
- [ ] Mode **Live** (Advanced Access disetujui).
- [ ] Atur penggunaan pesan: free-form hanya untuk user-initiated; template untuk business-initiated.

---

## 4 (ulang) — Env minimum di produksi

| Variable | Kegunaan | Nilai |
| --- | --- | --- |
| `WA_VERIFY_TOKEN` | handshake webhook GET | rahasia bebas |
| `WA_APP_SECRET` | verifikasi signature `X-Hub-Signature-256` | app secret Meta |
| `WA_API_TOKEN` | autentikasi `POST /messages` | system user token |
| `APP_ENCKEY` | enkripsi token di DB | random, 32+ karakter |

> Jangan pernah mencetak token ke logs.

---

## 5. Referensi resmi
- **WhatsApp Cloud API:** `https://developers.facebook.com/docs/whatsapp/cloud-api`
- **Business Verification:** `https://developers.facebook.com/docs/development/business-verification`
- **Message Template Policies:** `https://developers.facebook.com/docs/whatsapp/message-templates/whatsapp-policies`
- **Rate/Quality:** `https://developers.facebook.com/docs/whatsapp/limits`