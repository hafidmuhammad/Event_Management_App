---
name: ui-modernization
description: Gunakan ketika mengerjakan modernisasi UI, design token, theming, atau refactor presentational pada Event Management App. Berisi rencana bertahap untuk mengganti hex hardcoded dengan semantic token dan membangun komponen primitif yang global dan themeable. Jalankan hanya setelah business logic stabil.
---

# UI Modernization

Skill ini adalah rencana eksekusi UI yang ditunda sampai business logic selesai.
Jangan jalankan tahap apa pun kecuali user secara eksplisit meminta masuk ke UI.

Konsep yang dipilih: **Geist/Vercel-style dark ops console** untuk area dashboard,
dengan preset `stage` terpisah untuk route group `(presentation)`.

`design.md` di root adalah acuan token lama (palet Octo Code / GitHub Primer).
Setelah Tahap 1 selesai, `design.md` harus diperbarui agar merujuk ke token layer
baru, atau ditandai deprecated. `project-foundation` SKILL juga menyebut
`design.md` — update referensinya di tahap akhir.

## Aturan tetap

Berlaku di semua tahap, tanpa pengecualian.

1. **Presentational only.** Jangan ubah logika, data fetching, server action,
   schema, validasi, atau props signature. Kalau sebuah perubahan visual
   menuntut perubahan logika, hentikan dan tanya dulu.
2. **Nol hex di `src`**, kecuali `src/services/email.ts`. File itu menghasilkan
   HTML email; Outlook dan Gmail tidak mendukung CSS variables, jadi hex di situ
   wajib tetap hardcoded. Jangan sentuh.
3. **Pertahankan aksesibilitas.** `:focus-visible` outline, atribut aria,
   `prefers-reduced-motion`, focus trap pada modal, min-height tombol di mobile,
   dan `responsive-table` behavior harus tetap ekuivalen setelah refactor.
4. **Struktur DOM ekuivalen.** Boleh memecah baris JSX panjang agar terbaca,
   tapi urutan elemen dan atribut aria tidak berubah.
5. **Verifikasi tiap tahap**: `pnpm typecheck`, `pnpm lint`, `pnpm build`,
   `pnpm test`. Tahap tidak dianggap selesai sebelum keempatnya hijau.
6. **Light mode tetap didukung.** Dark adalah default, light adalah varian token.

## Kondisi awal (baseline)

Diukur sebelum pekerjaan dimulai. Pakai ini untuk mengukur progres.

- 107 hex literal tersebar di 37 file `src`.
- `globals.css` punya ~30 baris override `html.theme-light` dengan `!important`.
- `tailwind.config.ts` mendefinisikan `fontFamily.display` (Hubot Sans) yang
  tidak pernah dipakai; tidak ada font di-load via `next/font`.
- `components/ui` hanya berisi 6 file, tidak ada primitif Button/Card/Input/Table.
- Tidak ada icon library.
- Tailwind 3.4.17. Semua tahap di skill ini jalan di v3; migrasi ke v4
  bukan bagian dari skill ini.

Perintah untuk mengecek sisa hex:

```powershell
Get-ChildItem -Recurse -Path src -Include *.tsx,*.ts |
  Select-String -Pattern '#[0-9A-Fa-f]{6}' |
  Group-Object Path | Sort-Object Count -Descending |
  ForEach-Object { "{0,3}  {1}" -f $_.Count, $_.Name }
```

## Component registry

Tabel ini membuat setiap prompt bisa diarahkan ke area tertentu saja.
Saat user menyebut nama area, kerjakan **hanya** file di baris itu.
Angka dalam kurung adalah jumlah hex pada baseline.

| Area | File |
|---|---|
| `layout` | `src/components/layout/dashboard-shell.tsx` (11), `dashboard-navigation.tsx` (1), `theme-toggle.tsx`, `logout-button.tsx` |
| `ui-core` | `src/components/ui/status-pill.tsx` (3), `feedback-provider.tsx` (1), `brand-mark.tsx`, `dialog.tsx`, `modal.tsx`, `skeleton.tsx` |
| `auth` | `src/app/(auth)/layout.tsx` (7), `src/app/(auth)/login/page.tsx` (2), `src/components/auth/login-form.tsx` (1) |
| `dashboard` | `src/app/(dashboard)/dashboard/page.tsx` (8), `src/app/(dashboard)/loading.tsx` (2) |
| `events-list` | `src/app/(dashboard)/events/page.tsx` (2), `events/loading.tsx` (4), `events/[eventId]/page.tsx` (1), `events/[eventId]/loading.tsx` (2) |
| `events-forms` | `src/components/events/event-form.tsx` (10), `committee-editor.tsx` (2), `award-reorder-form.tsx` (1), `asset-upload-field.tsx` (1), `award-display.tsx` (2), `activity-list.tsx` |
| `events-subpages` | `src/app/(dashboard)/events/[eventId]/` → `doorprize/page.tsx`, `committee/page.tsx`, `email/page.tsx`, `awards/page.tsx`, `check-in/page.tsx`, `tickets/page.tsx`, `participants/page.tsx`, `participants/[participantId]/page.tsx` (masing-masing 1) |
| `checkin` | `src/components/checkin/checkin-console.tsx` (12) |
| `email-ui` | `src/components/email/email-builder.tsx` (10), `recipient-editor.tsx` (1), `send-test-form.tsx` (1) — **bukan** template output |
| `public` | `src/app/t/[token]/page.tsx` (2), `src/app/events/[eventId]/register/page.tsx` (1), `register/loading.tsx` (1), `src/app/events/committee-display/[token]/loading.tsx` (1) |
| `presentation` | `src/app/(presentation)/events/[eventId]/display/doorprize/page.tsx` (1) dan sibling display pages |
| `excluded` | `src/services/email.ts` (3) — jangan sentuh |

Urutan eksekusi yang disarankan jika mengerjakan semuanya:
`layout` → `ui-core` → `auth` → `dashboard` → `events-list` → `events-forms`
→ `events-subpages` → `checkin` → `email-ui` → `public` → `presentation`.

Alasan urutan: `layout` dan `ui-core` menyentuh primitif yang dipakai area lain,
jadi harus stabil lebih dulu. `presentation` terakhir karena punya preset sendiri.

---

## Tahap 1 — Fondasi token + primitif

Prasyarat: tidak ada. Ini selalu tahap pertama.
Scope: hanya `globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`,
dan file baru di `src/components/ui/`. Jangan ubah halaman/komponen lain.

### Prompt

```
Jalankan Tahap 1 dari skill ui-modernization: fondasi token + primitif.
Jangan ubah file halaman atau komponen lain selain yang disebut di scope.

1. globals.css — ganti :root dengan semantic token set lengkap:
   - permukaan: --bg, --surface, --surface-raised, --overlay
   - teks: --fg, --fg-muted, --fg-subtle, --fg-faint
   - border: --border, --border-strong
   - brand: --primary, --primary-fg, --primary-soft
   - status: --success, --warning, --danger, --info,
     masing-masing dengan pasangan -fg dan -soft
   - bentuk: --radius-sm/md/lg, --shadow-sm/md/lg
   Definisikan nilai di [data-theme="dark"] dan [data-theme="light"].
   HAPUS seluruh blok override html.theme-light yang memakai !important.

2. tailwind.config.ts — map semua token ke utility semantik
   (bg-surface, text-fg-muted, border-border, bg-primary, rounded-md,
   shadow-sm). Hapus palet lama (sky/sun/leaf/coral/ink/outline/surface)
   hanya setelah token pengganti lengkap tersedia.

3. src/app/layout.tsx — load Geist Sans + Geist Mono via next/font,
   set data-theme pada <html>, dan perbaiki inline theme script agar
   menulis atribut data-theme bukan class. Hindari FOUC.

4. src/components/ui — buat primitif dengan class-variance-authority
   + tailwind-merge (tambahkan sebagai dependency, versi di-pin):
   - Button: variant primary/secondary/outline/ghost/danger, size sm/md/lg
   - Card + CardHeader/CardTitle/CardContent/CardFooter
   - Input, Label, Field, Select, Textarea
   - Badge dengan variant status
   - Stat: label + value (tabular-nums) + hint
   - Table + Thead/Tbody/Tr/Th/Td, sticky header
   - EmptyState, Alert
   Semua memakai token, nol hex. Pertahankan min-height tombol
   dan responsive-table behavior yang sudah ada di globals.css.

5. Tambahkan lucide-react (versi di-pin) untuk ikon.

Jangan hapus utility lama di @layer components pada tahap ini —
masih dipakai 37 file. Penghapusan terjadi di Tahap 2.

Verifikasi: pnpm typecheck, pnpm lint, pnpm build, pnpm test.
```

### Definition of done

- `globals.css` tidak lagi punya `!important` untuk theming.
- Toggle `data-theme` antara dark/light mengubah seluruh warna tanpa override.
- Primitif ada dan type-safe; `font-display` benar-benar aktif di browser.
- Utility lama masih ada (belum dihapus), build hijau.

---

## Tahap 2 — Migrasi komponen

Prasyarat: Tahap 1 selesai dan terverifikasi.
Scope: **satu atau beberapa area dari Component Registry**, sesuai permintaan user.

Prompt di bawah pakai placeholder `<AREA>`. Ganti dengan nama area
dari registry (misal `checkin`, atau `layout, ui-core`).
Kalau user ingin semua, isi `<AREA>` dengan `semua area, dalam urutan
yang disarankan di registry` dan verifikasi per area.

### Prompt

```
Jalankan Tahap 2 dari skill ui-modernization untuk area: <AREA>.

Baca Component Registry di skill untuk daftar file persisnya.
Kerjakan HANYA file pada area tersebut. Jangan sentuh area lain.

Untuk setiap file:
- Ganti hex literal dengan utility token dari Tahap 1.
- Ganti class string manual (.btn-primary, .btn-outline, .btn-danger,
  .btn-small-*, .compact-table, .stat-card, .field-input, .field-label,
  .status-*, .notice-*, .empty-state, .detail-grid, .tab-*)
  dengan komponen primitif yang setara.
- Ganti icon placeholder (angka "1"/"2"/"3", inisial, glyph teks)
  dengan ikon lucide yang sesuai.
- Terapkan hirarki tipografi:
  angka statistik text-3xl font-semibold tabular-nums,
  heading halaman text-2xl tracking-tight,
  label text-[11px] font-medium uppercase tracking-wide.

Aturan tetap (jangan dilanggar):
- Presentational only. Tanpa perubahan logika, data fetching,
  server action, atau props signature.
- Struktur DOM dan atribut aria tetap ekuivalen.
- Jangan sentuh src/services/email.ts.

Setelah area selesai:
- Jalankan pnpm typecheck, pnpm lint, pnpm build, pnpm test.
- Grep hex yang tersisa di area ini dan laporkan tiap sisa
  beserta alasannya.
- Laporkan utility lama mana yang sudah tidak punya pemakai
  di seluruh src, tapi JANGAN hapus sampai semua area selesai.
```

### Prompt pembersihan (jalankan setelah semua area selesai)

```
Semua area Tahap 2 ui-modernization sudah dimigrasikan.
Sekarang bersihkan sisa-sisanya:

1. Hapus utility di @layer components pada globals.css yang
   sudah tidak punya pemakai di src. Konfirmasi nol pemakai
   dengan grep sebelum menghapus tiap utility.
2. Hapus token/palet Tailwind lama yang sudah tidak terpakai.
3. Grep seluruh src untuk hex literal. Satu-satunya hasil yang
   boleh muncul adalah 3 hex di src/services/email.ts.
   Laporkan hasilnya apa adanya; jangan klaim selesai kalau
   masih ada sisa lain.
4. Verifikasi: pnpm typecheck, pnpm lint, pnpm build, pnpm test.
```

### Definition of done

- Grep hex di `src` hanya menyisakan 3 occurrence di `services/email.ts`.
- Tidak ada class string design lama di `@layer components`.
- Keempat perintah verifikasi hijau.

---

## Tahap 3 — Theme customization

Prasyarat: Tahap 2 selesai untuk semua area.

### Prompt

```
Jalankan Tahap 3 dari skill ui-modernization: theme customization.

1. Buat src/lib/theme/presets.ts berisi preset yang hanya memuat
   nilai token (tanpa logika UI): geist-dark, geist-light,
   brand-dryport, high-contrast, stage.
2. Inject preset sebagai [data-theme="..."] di globals.css.
3. Upgrade src/components/layout/theme-toggle.tsx menjadi theme picker:
   persist ke localStorage dengan key yang sudah ada ("event-theme"),
   hormati prefers-color-scheme sebagai default saat belum ada pilihan,
   dan hindari FOUC lewat inline script di layout.
   Migrasikan nilai localStorage lama ("light") agar tidak break.
4. Terapkan preset "stage" sebagai data-theme scoped di layout
   route group (presentation) saja — tipografi jauh lebih besar,
   gradient hero, aksen hangat. Area dashboard tidak terpengaruh.
5. Tulis .kiro/steering/design-system.md (inclusion: fileMatch,
   fileMatchPattern mencakup src/**/*.tsx) berisi:
   daftar token, daftar primitif beserta variant-nya, dan aturan
   "jangan pernah tulis hex literal di src kecuali services/email.ts".
6. Update design.md di root agar merujuk token layer baru,
   dan perbarui baris UI di .codex/skills/project-foundation/SKILL.md
   yang masih menyebut "token Octo Code dari design.md".

Verifikasi: pnpm typecheck, pnpm lint, pnpm build, pnpm test.
Plus cek manual tiap preset di dashboard dan di halaman presentation.
```

### Definition of done

- Ganti satu atribut `data-theme` mengubah seluruh aplikasi.
- Halaman `(presentation)` punya tema sendiri tanpa memengaruhi dashboard.
- `design-system.md` ada, jadi sesi berikutnya otomatis konsisten.

---

## Catatan untuk sesi mendatang

- Jika user ingin pindah ke shadcn/ui penuh, itu menuntut Tailwind v4.
  Jadikan tahap terpisah, jangan dicampur ke Tahap 1–3.
- Jika jumlah hex pada baseline tidak lagi cocok saat skill dijalankan
  (business logic menambah file baru), jalankan ulang perintah grep
  dan perbarui Component Registry sebelum mulai.
- Setiap tahap wajib dilaporkan apa adanya. Build yang exit 0 bukan
  bukti bahwa migrasi visual benar; sebutkan apa yang belum diverifikasi.

---

## Status update (light-mode token audit)

A token pass has already landed outside the staged plan above, so the baseline
numbers in this skill are stale. Current state:

- `src/app/globals.css` now carries a full semantic token set on `:root` with a
  `html.theme-light` variant, and every `@layer components` utility resolves
  through those tokens. The old per-class `!important` light overrides were
  reduced to a small safety net for overlooked literals.
- Components use token utilities (`ink`, `ink-muted`, `surface-card`,
  `bg-[var(--surface)]`, …) instead of literal Octo Code hex. The remaining
  literals are intentional: the email preview paper, the QR background, and
  `src/services/email.ts`.
- The shell was rebuilt around `--sidebar-width` with a collapsible sidebar. See
  the `app-shell` skill, which is now the source of truth for tokens and shell
  layout.

Before running Tahap 1 or 2, re-run the grep command above and rebuild the
Component Registry counts. Tahap 1's token work is largely done; what remains
unstarted is the `cva` primitive library, `next/font`, `lucide-react`, the
`data-theme` attribute migration, and the Tahap 3 preset system.
