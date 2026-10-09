# Project

Event Management System.

## Stack

- Next.js App Router
- TypeScript
- Tailwind
- MySQL
- Drizzle
- Auth.js
- Zod

## Database

MySQL lokal menggunakan `DATABASE_URL`. Test wajib menggunakan database terpisah melalui `TEST_DATABASE_URL`. Jangan drop, truncate, atau reset database development saat menjalankan test.

## Architecture

- Server Component first.
- Client Component hanya jika membutuhkan browser API, state lokal interaktif, atau event handler.
- Business logic yang reusable/critical berada di service layer tipis, bukan langsung di UI.
- Hindari repository/DAO generik, state manager global, dan backend terpisah.

## Design

`design.md` adalah source of truth UI dan menggunakan sistem warna Octo Code yang disediakan pemilik project. Wajib membacanya sebelum mengubah UI.

## Skills

Sebelum mengubah fitur existing, baca Skill relevan di `.codex/skills/`. Setelah behavior fitur berubah, update Skill terkait.

## QA

Setiap fase harus lolos lint, typecheck, test, dan build sebelum dianggap selesai.

## Scope

Jangan mengerjakan fase berikutnya tanpa perintah eksplisit.
