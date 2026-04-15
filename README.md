# Fleet WA Bot Starter

Starter project untuk bot WhatsApp internal Fleet OPS.

## Fitur
- Baileys adapter terpisah dari business logic
- Command router yang siap dimigrasikan ke Cloud API
- Health check HTTP
- Scheduler alert harian
- Mock repository untuk demo cepat
- Role guard sederhana berbasis whitelist nomor

## Command bawaan
- `HELP`
- `CEK SURAT <PLAT>`
- `UPDATE SURAT <PLAT> <JENIS> <YYYY-MM-DD>`
- `CEK STOCK BAN <SKU>`
- `UPDATE BAN <PLAT> <POSISI> <KM>`
- `ALERT HARI INI`

## Jalankan
```bash
npm install
cp .env.example .env
npm run dev
```

Scan QR dari terminal.

## Struktur
```txt
src/
  adapters/whatsapp/     # transport layer
  app/                   # bootstrap app
  config/                # env dan logger
  handlers/              # command handlers
  repositories/          # data access
  routes/                # health route
  scheduler/             # cron jobs
  services/              # business logic
  utils/                 # formatter, parser, helpers
```

## Migrasi ke Cloud API
Saat pindah ke WhatsApp Cloud API, fokus perubahan utamanya ada di:
- `src/adapters/whatsapp/baileysAdapter.js`

Business logic, parser, handler, service, dan scheduler tetap bisa dipakai.
