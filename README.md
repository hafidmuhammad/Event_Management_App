<<<<<<< HEAD
# Event Management MVP

Event Management MVP berbasis Next.js App Router, TypeScript, Tailwind, MySQL, Drizzle, dan Auth.js Credentials.

## Requirements

- Node.js 20+
- npm atau pnpm
- MySQL 8+ dengan database development dan database test terpisah

## Setup

1. Salin `.env.example` menjadi `.env.local`, lalu isi koneksi database dan `AUTH_SECRET`.
2. Install dependency: `npm.cmd install` atau `pnpm install`.
3. Generate dan jalankan migration: `npm.cmd run db:generate`, lalu `npm.cmd run db:migrate`.
4. Seed akun development: `npm.cmd run db:seed`.
5. Seed event/participant/template dummy opsional: `npm.cmd run db:seed:demo`.
6. Jalankan aplikasi: `npm.cmd run dev`.

`db:seed:demo` hanya menyimpan event DRAFT, peserta dummy, dan template `[DRAFT]`; tidak mengirim atau membroadcast email.

## Development account

- `admin@example.local`
- `manager@example.local`
- `reception@example.local`

Password development lokal dibuat oleh `src/db/seed.ts`; jangan gunakan di production.

## QA commands

```text
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Migration test harus dijalankan terhadap `TEST_DATABASE_URL` sebelum integration test. Email default-nya hanya membuat preview HTML lokal di `.email-previews/`. Untuk mengirim melalui Office 365, isi kredensial mailbox di `.env.local` dan ubah `MAIL_TRANSPORT=smtp`; aplikasi menggunakan STARTTLS ke `smtp.office365.com:587`. `SMTP_FROM` opsional dan default ke `SMTP_USER`. Restart server setelah mengubah environment.

Mailbox dan tenant Microsoft 365 harus mengizinkan SMTP AUTH. Jika tenant mewajibkan MFA atau menonaktifkan SMTP AUTH/basic authentication, username dan password biasa tidak akan berhasil; administrator Microsoft 365 perlu mengizinkan SMTP AUTH atau aplikasi harus dikonfigurasi dengan OAuth 2.0. Jangan commit file environment atau memasukkan kredensial ke source code.
=======
# Event_Management_App
>>>>>>> bb483894b1210af3c0a47b9c754e62824d1d690f
