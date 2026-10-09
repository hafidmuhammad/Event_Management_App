---
name: project-foundation
description: Gunakan ketika mengerjakan fondasi, arsitektur, database, autentikasi, authorization dasar, design foundation, atau konfigurasi utama aplikasi Event Management.
---

# Project Foundation

## Fakta implementation

- Framework: Next.js App Router dengan TypeScript (resolved Next.js 15.5.27, React 19.3.0).
- Package manager: pnpm.
- UI: Tailwind CSS dengan semantic token CSS variable. Nilai semua warna ada di `src/lib/theme/presets.ts` (preset `dark`/`light` = palet Octo Code dari `design.md`, plus `geist-dark`, `geist-light`, `brand-dryport`, `high-contrast`, `stage`); blok `[data-theme]` di `src/app/globals.css` tergenerasi lewat `pnpm theme:css`. Light mode adalah preset, bukan override per komponen. Aturan pakai primitif dan token: `.kiro/steering/design-system.md`. Lihat SKILL `app-shell`.
- Modal mengunci fokus keyboard, mengembalikan fokus ke pemicu, mengunci scroll halaman, dan meminta konfirmasi saat menutup perubahan form yang belum disimpan.
- Tab event menggunakan grid pada mobile. Tema (`data-theme`) dan kepadatan (`data-density`) di `<html>` diterapkan sebelum hidrasi oleh skrip di `<head>`, disimpan di `localStorage` (`event-theme`, `event-density`), dan tanpa pilihan mengikuti sistem operasi. Pemilihnya ada di menu `...` top bar.
- Check-in manual dan QR terpisah dengan navigasi keyboard. Network errors tidak mengubah status peserta; confirm sukses memperbarui counter/recent lewat router refresh. Kamera dibatalkan ketika stop, pindah tab, atau unmount; fallback token tersedia tanpa kamera.
- Database: MySQL melalui `mysql2` dan Drizzle ORM.
- Schema: dua belas domain/support table: enam tabel inti ditambah `activity_logs`, `email_broadcasts`, `email_deliveries`, serta library global `global_email_templates`, `contact_lists`, dan `contacts`; doorprize dan award tetap JSON versioned pada `events`.
- Konfirmasi memakai `FeedbackProvider` dan modal `<dialog>` aplikasi, bukan `window.confirm/alert/prompt`. Toast success/info hilang otomatis; error tetap sampai ditutup. Toast ditempatkan pada modal aktif agar tidak tertutup top layer.
- Redirect `notice/error` menghasilkan toast; redirect success menutup modal aksi. Shared helper tanggal menggunakan Asia/Jakarta (WIB) untuk tampilan dan input event.
- Migrasi lokal tambahan yang telah disetujui dijalankan lewat `npx.cmd tsx scripts/migrate-local.ts`, dengan guard development/test terpisah dan host lokal.
- Migration: `pnpm db:generate` lalu `pnpm db:migrate`. Database test dimigrasikan terpisah lewat `pnpm db:migrate:test` (hanya `TEST_DATABASE_URL`, tanpa drop/truncate).
- Seed development: `pnpm db:seed`; dummy event/template opsional: `npm.cmd run db:seed:demo`.
- Auth: Auth.js 5.0.0-beta.32 Credentials provider, password bcryptjs, JWT session.
- ORM runtime: Drizzle ORM 0.44.7 dengan mysql2 3.24.5.
- Role: `ADMIN`, `EVENT_MANAGER`, `RECEPTIONIST`.
- Authorization: `requireAuth()` dan `requireRole()` di `src/lib/auth/authorization.ts`.
- Settings event dapat dilihat semua role staff; RECEPTIONIST memperoleh ringkasan read-only tanpa redirect Dashboard. Form edit dan server action tetap hanya ADMIN/EVENT_MANAGER.
- Database connection: reusable Drizzle MySQL connection di `src/db/index.ts` dari `DATABASE_URL`.
- Service convention: query dan business logic reusable berada di `src/services/`.
- Component convention: Server Components sebagai default; client hanya untuk form/logout interaktif.
- Validation: Zod schema di `src/lib/validation/`.
- Testing: Vitest dengan focused tests di `src/**/*.test.ts`.

## Perintah

- `pnpm dev`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
