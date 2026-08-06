# DtmX WhatsApp Automation

Customer Service (CS) otomatis via **WhatsApp Cloud API (Meta)** untuk bisnis jasa.
Backend monolitik sederhana (NestJS + Prisma PostgreSQL), jadi mudah dipush sebagai
repositori mandiri.

**Tumpukan:**
- **Backend:** NestJS + Prisma (PostgreSQL)
- **Auto-reply AI:** OpenAI / Anthropic / Gemini (opsional)
- **Pembayaran:** manual (invoice + bukti transfer) — tanpa gateway, jadi bisa jalan
  jalan sementara menunggu verifikasi payment gateway.

> Ini MVP. Dokumen penting: **[docs/GO-LIVE-META.md](docs/GO-LIVE-META.md)** (wajib
> dibaca sebelum rilis produksi) dan **[docs/WA-CS-AUTOMATION-MVP.md](docs/WA-CS-AUTOMATION-MVP.md)**
> (desain & roadmap).

---

## Fitur (MVP)

- Hubungkan nomor WhatsApp Business via Cloud API Meta.
- Inbox multi-konversi: pesan masuk tampil per pelanggan; balas real-time.
- Auto-reply berbasis kata kunci: `menu`, `harga`, `lokasi`, `jam`.
- Balasan AI (OpenAI/Anthropic/Gemini) untuk pertanyaan bebas (opsional, per konversasi).
- Verifikasi webhook `X-Hub-Signature-256` untuk keamanan.
- Token transaksi disimpan **terenskripsi** (AES-256-GCM).
- Pembayaran manual: invoice → bukti transfer → konfirmasi admin.

---

## Prasyarat

- Node.js `>= 20`
- PostgreSQL `>= 14` (database khusus proyek ini)
- Akun Meta for Developers (WhatsApp Cloud API) — ikuti [GO-LIVE-META](docs/GO-LIVE-META.md)

---

## Setup

### 1. Install dependency

```bash
npm install
```

> Di komputer biasa `npm run dev` & `npm run build` langsung jalan. Di lingkungan
> khusus (mis. Termux) gunakan `node node_modules/typescript/bin/tsc` bila binary
> bin `tsc` tidak terresolve.

### 2. Konfigurasi environment

```bash
cp .env.example .env
```

Paling penting di dalam `.env`:

```ini
DATABASE_URL=postgresql://user:pass@localhost:5432/dtmx_wa
WA_VERIFY_TOKEN=change-me-verify-token
WA_APP_SECRET=change-me-app-secret
WA_API_TOKEN=change-me-api-token
APP_ENCKEY=change-me-32-char-random-secret
```

### 3. Buat database & migrasi

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Versi cepat tanpa migrasi:

```bash
npx prisma db push
```

### 4. (Opsional) Seed

```bash
npx prisma db seed
```

---

## Menjalankan

**Development (watch):**

```bash
npm run start:dev
```

**Build + produksi:**

```bash
npm run build
npm start
```

API berjalan di `http://localhost:3001` (ubah `PORT` di `.env`), prefix `/api`.

## Web UI (panel SPA)

Frontend React + Vite + Tailwind berada di `web/`. Ikuti langkah:

```bash
# Install frontend
cd web && npm install && cd ..

# Jalankan dev server (port 4200, proxy /api -> localhost:3001)
npm run web:dev

# Build produksi (output di web/dist)
npm run web:build
```

Halaman yang tersedia: **Login**, **Ringkasan**, **Hubungkan**, **Inbox**, **Pembayaran**.
Login memakai `AUTH_EMAIL` / `AUTH_PASSWORD` dari `.env`.

> **Penting:** pastikan API backend sudah berjalan (`npm run start:dev` di terminal terpisah)
> sebelum `npm run web:dev`, karena panel mengandalkan `/api` yang di-proxy ke API.

---

## Endpoint utama

### WhatsApp

| Method | Path | Deskripsi |
| --- | --- | --- |
| `GET` | `/api/wa/webhook` | Handshake verify (Meta) |
| `POST` | `/api/wa/webhook` | Terima pesan masuk (Meta), verifikasi signature |
| `POST` | `/api/wa/connect` | Hubungkan nomor bisnis |
| `GET` | `/api/wa/businesses` | Daftar bisnis |
| `GET` | `/api/wa/conversations?businessId=` | Daftar konversasi |
| `GET` | `/api/wa/conversations/:id/messages` | Pesan dalam konversasi |

### Pembayaran manual (`/api/payments`)

| Method | Path | Deskripsi |
| --- | --- | --- |
| `GET` | `/manual-info` | Info rekening tujuan |
| `POST` | `/settings` | Konfigurasi rekening (admin) |
| `POST` | `/invoices` | Buat invoice |
| `POST` | `/invoices/:id/proof` | Upload bukti transfer |
| `POST` | `/invoices/:id/confirm` | Setujui → `PAID` |
| `POST` | `/invoices/:id/reject` | Tolak → `REJECTED` |
| `GET` | `/invoices` | Daftar invoice + bukti |

---

## Alur singkat

1. `POST /api/wa/connect` dengan data nomor (lihat [GO-LIVE-META](docs/GO-LIVE-META.md)).
2. Pesan masuk → `POST /api/wa/webhook` → simpan + balas otomatis (rule/AI).
3. Langganan: admin `POST /invoices`; pelanggan transfer ke rekening dari `/manual-info`,
   lalu `upload proof`; admin `confirm` → invoice `PAID`.

---

## Variabel environment (referensi)

| Variabel | Deskripsi | Wajib |
| --- | --- | --- |
| `PORT` | Port server (default 3001) | no |
| `DATABASE_URL` | PostgreSQL URL untuk Prisma | **ya** |
| `WA_VERIFY_TOKEN` | Token handshake webhook | **ya** |
| `WA_APP_SECRET` | App secret Meta (verifikasi signature) | **ya** |
| `WA_API_TOKEN` | System user access token | **ya** |
| `APP_ENCKEY` | Kunci enkripsi token (≥32 random) | **ya** |
| `AUTH_EMAIL` | Email login panel SPA | **ya** (untuk login UI) |
| `AUTH_PASSWORD` | Password login panel SPA | **ya** (untuk login UI) |
| `JWT_SECRET` | Signing key (dev) | no |
| `JWT_EXPIRES_IN` | Masa berlaku token (default 15m) | no |
| `CORS_ORIGINS` | Origin diizinkan (kosong = nonaktif) | no |
| `AI_PROVIDER` | Provider AI: openai/anthropic/gemini | no |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI | no |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Anthropic | no |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Gemini | no |

---

## Scripts

| Perintah | Fungsi |
| --- | --- |
| `npm run start:dev` | Nest watch mode |
| `npm run build` | Compile ke `dist/` |
| `npm start` | Jalankan build (`node dist/main.js`) |
| `npm run lint` | `tsc --noEmit` |
| `npx prisma generate` | Regenerasi Prisma Client |
| `npx prisma migrate dev --name x` | Migrasi dev |
| `npx prisma db push` | Sinkron schema cepat |
| `npx prisma db seed` | Jalankan seed |

---

## Roadmap (pintasan)

Lihat [docs/WA-CS-AUTOMATION-MVP.md](docs/WA-CS-AUTOMATION-MVP.md) untuk detail.

- **[P1]** Setup Meta + backend + inbox + bot rule/AI.
- **[P2]** Approval template + business verification + pilot bisnis + billing manual.
- **[P3]** [Tambahan berdasarkan feedback] Langganan otomatis (gateway), analitik.

---

## Lisensi

Proyek internal; izin penggunaan komersial dari pemilik repositori.